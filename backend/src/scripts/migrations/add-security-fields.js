import mongoose from 'mongoose';
import { User } from '../../models/user.model.js';
import dotenv from 'dotenv';
import { DB_NAME } from '../../constants.js';

// Load environment variables
dotenv.config();

/**
 * Migration: Add Security Fields to User Schema
 * 
 * This migration safely adds new security fields to existing users
 * without disrupting the production service.
 * 
 * New fields being added:
 * - lastLoginAt: Date
 * - lastLoginIP: String
 * - lastActivity: Date (defaults to current time)
 * - isActive: Boolean (defaults to true)
 * - isEmailVerified: Boolean (defaults to false)
 * - activeTokens: Array (defaults to empty array)
 */

const BATCH_SIZE = 50; // Process users in batches to avoid memory issues
const DATABASE_ATLAS = process.env.DATABASE_ATLAS;

const dbUri = DATABASE_ATLAS.replace("<DB_NAME>", DB_NAME);

async function connectToDatabase() {
  try {
    console.log('Connecting to MongoDB with URI:', dbUri);
    await mongoose.connect(dbUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}

async function getUsersCount() {
  try {
    const count = await User.countDocuments();
    console.log(`📊 Total users in database: ${count}`);
    return count;
  } catch (error) {
    console.error('❌ Error counting users:', error);
    throw error;
  }
}

async function checkExistingSecurityFields() {
  try {
    console.log('🔍 Checking existing security fields...');
    
    // Check if any users already have the new fields
    const usersWithNewFields = await User.countDocuments({
      $or: [
        { lastActivity: { $exists: true } },
        { isActive: { $exists: true } },
        { activeTokens: { $exists: true } }
      ]
    });
    
    const usersWithoutNewFields = await User.countDocuments({
      $and: [
        { lastActivity: { $exists: false } },
        { isActive: { $exists: false } },
        { activeTokens: { $exists: false } }
      ]
    });
    
    console.log(`📈 Users with new security fields: ${usersWithNewFields}`);
    console.log(`📉 Users without new security fields: ${usersWithoutNewFields}`);
    
    return { usersWithNewFields, usersWithoutNewFields };
  } catch (error) {
    console.error('❌ Error checking existing fields:', error);
    throw error;
  }
}

async function migrateUsersBatch(skip, limit) {
  try {
    console.log(`🔄 Processing batch: ${skip + 1} to ${skip + limit}`);
    
    // Find users without the new security fields
    const users = await User.find({
      $and: [
        { lastActivity: { $exists: false } },
        { isActive: { $exists: false } },
        { activeTokens: { $exists: false } }
      ]
    })
    .skip(skip)
    .limit(limit)
    .select('_id username email createdAt');
    
    if (users.length === 0) {
      console.log('✅ No more users to migrate in this batch');
      return 0;
    }
    
    console.log(`📝 Found ${users.length} users to migrate`);
    
    // Prepare bulk operations
    const bulkOps = users.map(user => {
      const now = new Date();
      
      return {
        updateOne: {
          filter: { _id: user._id },
          update: {
            $set: {
              // Session tracking fields
              lastActivity: user.createdAt || now, // Use creation date as initial activity
              
              // Security fields
              isActive: true,
              isEmailVerified: false, // Set to false for security, users can verify later
              
              // Token tracking
              activeTokens: []
            }
            // Note: lastLoginAt, lastLoginIP are intentionally left undefined
            // They will be set when users actually log in
          }
        }
      };
    });
    
    // Execute bulk operation
    const result = await User.bulkWrite(bulkOps, { ordered: false });
    
    console.log(`✅ Successfully migrated ${result.modifiedCount} users`);
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);
    
    if (result.writeErrors && result.writeErrors.length > 0) {
      console.warn(`⚠️ Write errors: ${result.writeErrors.length}`);
      result.writeErrors.forEach(error => {
        console.warn(`   Error: ${error.errmsg}`);
      });
    }
    
    return result.modifiedCount;
    
  } catch (error) {
    console.error('❌ Error migrating users batch:', error);
    throw error;
  }
}

async function validateMigration() {
  try {
    console.log('🔍 Validating migration...');
    
    // Check that all users now have the required fields
    const usersWithoutRequiredFields = await User.countDocuments({
      $or: [
        { lastActivity: { $exists: false } },
        { isActive: { $exists: false } },
        { activeTokens: { $exists: false } }
      ]
    });
    
    if (usersWithoutRequiredFields === 0) {
      console.log('✅ Migration validation successful - all users have required fields');
      return true;
    } else {
      console.error(`❌ Migration validation failed - ${usersWithoutRequiredFields} users still missing required fields`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error validating migration:', error);
    throw error;
  }
}

async function createBackup() {
  try {
    console.log('💾 Creating backup of user data...');
    
    // Create a simple backup by exporting critical user data
    const users = await User.find({})
      .select('_id username email fullName role createdAt updatedAt')
      .lean();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      users: users
    };
    
    // In a real production environment, you'd save this to a file or backup service
    console.log(`✅ Backup created with ${users.length} users`);
    console.log('💡 In production, save this backup to a secure location');
    
    return backupData;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Starting User Security Fields Migration');
  console.log('=====================================');
  
  try {
    // Step 1: Connect to database
    await connectToDatabase();
    
    // Step 2: Create backup
    await createBackup();
    
    // Step 3: Get initial counts
    const totalUsers = await getUsersCount();
    
    // Step 4: Check existing fields
    const { usersWithoutNewFields } = await checkExistingSecurityFields();
    
    if (usersWithoutNewFields === 0) {
      console.log('✅ All users already have security fields. Migration not needed.');
      return;
    }
    
    console.log(`📋 Need to migrate ${usersWithoutNewFields} users`);
    
    // Step 5: Migrate users in batches
    let totalMigrated = 0;
    let skip = 0;
    
    while (skip < usersWithoutNewFields) {
      const migratedInBatch = await migrateUsersBatch(skip, BATCH_SIZE);
      
      if (migratedInBatch === 0) {
        break; // No more users to migrate
      }
      
      totalMigrated += migratedInBatch;
      skip += BATCH_SIZE;
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Migration completed! Total users migrated: ${totalMigrated}`);
    
    // Step 6: Validate migration
    const isValid = await validateMigration();
    
    if (isValid) {
      console.log('🎉 Migration successful and validated!');
    } else {
      console.error('❌ Migration validation failed. Please check the logs.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await disconnectFromDatabase();
  }
}

// Rollback function (in case something goes wrong)
async function rollbackMigration() {
  console.log('🔄 Starting Migration Rollback');
  console.log('==============================');
  
  try {
    await connectToDatabase();
    
    console.log('⚠️ Rolling back security fields...');
    
    const result = await User.updateMany(
      {},
      {
        $unset: {
          lastLoginAt: "",
          lastLoginIP: "",
          lastActivity: "",
          isActive: "",
          isEmailVerified: "",
          activeTokens: ""
        }
      }
    );
    
    console.log(`✅ Rollback completed. Modified ${result.modifiedCount} users`);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await disconnectFromDatabase();
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'migrate') {
  runMigration()
    .then(() => {
      console.log('🎉 Migration process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration process failed:', error);
      process.exit(1);
    });
} else if (command === 'rollback') {
  rollbackMigration()
    .then(() => {
      console.log('🔄 Rollback completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Rollback failed:', error);
      process.exit(1);
    });
} else if (command === 'check') {
  connectToDatabase()
    .then(async () => {
      await getUsersCount();
      await checkExistingSecurityFields();
      await disconnectFromDatabase();
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Check failed:', error);
      process.exit(1);
    });
} else {
  console.log(`
🔧 User Security Fields Migration Tool

Usage:
  node add-security-fields.js migrate   - Run the migration
  node add-security-fields.js rollback  - Rollback the migration
  node add-security-fields.js check     - Check migration status

Examples:
  npm run migrate:security
  node src/scripts/migrations/add-security-fields.js migrate
  node src/scripts/migrations/add-security-fields.js check
  `);
  process.exit(0);
}

export { runMigration, rollbackMigration }; 