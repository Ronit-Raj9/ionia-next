import mongoose from 'mongoose';
import { User } from '../../models/user.model.js';
import dotenv from 'dotenv';
import { DB_NAME } from '../../constants.js';

// Load environment variables
dotenv.config();

const DATABASE_ATLAS = process.env.DATABASE_ATLAS;
const dbUri = DATABASE_ATLAS.replace("<DB_NAME>", DB_NAME);

/**
 * Migration for email verification fields only
 * 
 * New fields added:
 * - emailVerificationToken: String (for email verification tokens)
 * - emailVerificationExpires: Date (token expiry)
 * - emailVerificationAttempts: Object (rate limiting for verification)
 * 
 * Note: emailPreferences field has been removed as it's not needed
 */

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const connectionInstance = await mongoose.connect(dbUri);
    console.log(`✅ MongoDB connected!! DB HOST: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.error("❌ MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

const addEmailVerificationFields = async () => {
  console.log('\n🔧 Starting Email Verification Fields Migration...\n');
  
  try {
    // Connect to the database
    await connectDB();

    // Check if migration has already been run
    const existingUsers = await User.find({
      emailVerificationToken: { $exists: true }
    }).limit(1);

    if (existingUsers.length > 0) {
      console.log('⚠️ Email verification fields migration appears to have already been run.');
      console.log('Found users with existing email verification fields.');
      
      const proceed = process.argv.includes('--force');
      if (!proceed) {
        console.log('Use --force flag to run migration anyway.');
        process.exit(0);
      } else {
        console.log('🔄 Force flag detected, proceeding with migration...');
      }
    }

    // Get all users
    console.log('📊 Fetching all users...');
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users to migrate.`);

    if (allUsers.length === 0) {
      console.log('✅ No users found. Migration completed.');
      process.exit(0);
    }

    // Migration statistics
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process users in batches for better performance
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(allUsers.length / BATCH_SIZE);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, allUsers.length);
      const batch = allUsers.slice(start, end);
      
      console.log(`\n📦 Processing batch ${i + 1}/${totalBatches} (users ${start + 1}-${end})...`);

      // Prepare bulk operations
      const bulkOps = batch.map(user => {
        const updateFields = {};
        const unsetFields = {};

        // Add email verification token fields if not present
        if (!user.emailVerificationToken) {
          updateFields.emailVerificationToken = null;
        }
        if (!user.emailVerificationExpires) {
          updateFields.emailVerificationExpires = null;
        }

        // Add email verification attempts tracking if not present
        if (!user.emailVerificationAttempts) {
          updateFields.emailVerificationAttempts = {
            count: 0,
            lastAttempt: null,
            blocked: false,
            blockedUntil: null
          };
        }

        // Remove email preferences if they exist
        if (user.emailPreferences) {
          unsetFields.emailPreferences = "";
        }

        const updateOperation = {};
        if (Object.keys(updateFields).length > 0) {
          updateOperation.$set = updateFields;
        }
        if (Object.keys(unsetFields).length > 0) {
          updateOperation.$unset = unsetFields;
        }

        return Object.keys(updateOperation).length > 0 ? {
          updateOne: {
            filter: { _id: user._id },
            update: updateOperation
          }
        } : null;
      }).filter(op => op !== null);

      if (bulkOps.length === 0) {
        console.log('   ✅ All users in this batch already have the required fields.');
        continue;
      }

      try {
        // Execute bulk update
        const result = await User.bulkWrite(bulkOps, { ordered: false });
        
        console.log(`   ✅ Updated ${result.modifiedCount} users in batch ${i + 1}`);
        successCount += result.modifiedCount;

      } catch (error) {
        console.error(`   ❌ Error processing batch ${i + 1}:`, error.message);
        errorCount += batch.length;
        errors.push({
          batch: i + 1,
          error: error.message,
          users: batch.map(u => ({ id: u._id, email: u.email }))
        });
      }
    }

    // Final verification
    console.log('\n🔍 Verifying migration results...');
    const verificationResult = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          usersWithEmailVerificationToken: {
            $sum: { $cond: [{ $ne: [{ $type: "$emailVerificationToken" }, "missing"] }, 1, 0] }
          },
          usersWithEmailVerificationAttempts: {
            $sum: { $cond: [{ $ne: [{ $type: "$emailVerificationAttempts" }, "missing"] }, 1, 0] }
          },
          usersWithEmailPreferences: {
            $sum: { $cond: [{ $ne: [{ $type: "$emailPreferences" }, "missing"] }, 1, 0] }
          }
        }
      }
    ]);

    const verification = verificationResult[0];

    // Migration summary
    console.log('\n📋 Email Verification Fields Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Total users processed: ${allUsers.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`Users with email verification token field: ${verification.usersWithEmailVerificationToken}`);
    console.log(`Users with email verification attempts: ${verification.usersWithEmailVerificationAttempts}`);
    console.log(`Users with email preferences (should be 0): ${verification.usersWithEmailPreferences}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. Batch ${error.batch}: ${error.error}`);
      });
    }

    // Check if migration was successful
    const isSuccessful = verification.usersWithEmailVerificationToken === verification.totalUsers &&
                        verification.usersWithEmailVerificationAttempts === verification.totalUsers &&
                        verification.usersWithEmailPreferences === 0;

    if (isSuccessful) {
      console.log('\n✅ Email verification fields migration completed successfully!');
      console.log('\n📧 Features enabled:');
      console.log('  • Email verification tokens for secure verification');
      console.log('  • Email verification attempts tracking and rate limiting');
      console.log('  • Email preferences field removed (not needed)');
    } else {
      console.log('\n⚠️ Migration completed with some issues. Please review the results above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n💾 Database connection closed.');
  }
};

const checkMigrationStatus = async () => {
  console.log('\n🔍 Checking Email Verification Fields Migration Status...\n');
  
  try {
    await connectDB();

    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          usersWithEmailVerificationToken: {
            $sum: { $cond: [{ $ne: [{ $type: "$emailVerificationToken" }, "missing"] }, 1, 0] }
          },
          usersWithEmailVerificationAttempts: {
            $sum: { $cond: [{ $ne: [{ $type: "$emailVerificationAttempts" }, "missing"] }, 1, 0] }
          },
          usersWithEmailPreferences: {
            $sum: { $cond: [{ $ne: [{ $type: "$emailPreferences" }, "missing"] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      console.log('📊 No users found in the database.');
      return;
    }

    const { totalUsers, usersWithEmailVerificationToken, usersWithEmailVerificationAttempts, usersWithEmailPreferences } = stats[0];

    console.log('📊 Migration Status:');
    console.log('='.repeat(40));
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with email verification token field: ${usersWithEmailVerificationToken} (${totalUsers > 0 ? Math.round((usersWithEmailVerificationToken/totalUsers)*100) : 0}%)`);
    console.log(`Users with email verification attempts: ${usersWithEmailVerificationAttempts} (${totalUsers > 0 ? Math.round((usersWithEmailVerificationAttempts/totalUsers)*100) : 0}%)`);
    console.log(`Users with email preferences: ${usersWithEmailPreferences} (${totalUsers > 0 ? Math.round((usersWithEmailPreferences/totalUsers)*100) : 0}%)`);

    const isComplete = usersWithEmailVerificationToken === totalUsers && 
                      usersWithEmailVerificationAttempts === totalUsers &&
                      usersWithEmailPreferences === 0;

    if (isComplete) {
      console.log('\n✅ Migration is complete! All users have the required email verification fields.');
    } else {
      console.log('\n⚠️ Migration is incomplete. Run the migration to add missing fields.');
    }

  } catch (error) {
    console.error('\n❌ Error checking migration status:', error);
  } finally {
    await mongoose.connection.close();
  }
};

const rollbackMigration = async () => {
  console.log('\n🔄 Rolling back Email Verification Fields Migration...\n');
  
  try {
    await connectDB();

    const result = await User.updateMany(
      {},
      {
        $unset: {
          emailVerificationToken: "",
          emailVerificationExpires: "",
          emailVerificationAttempts: ""
        }
      }
    );

    console.log(`✅ Rollback completed. Removed email verification fields from ${result.modifiedCount} users.`);

  } catch (error) {
    console.error('\n❌ Rollback failed:', error);
  } finally {
    await mongoose.connection.close();
  }
};

const removeEmailPreferences = async () => {
  console.log('\n🗑️ Removing Email Preferences from all users...\n');
  
  try {
    await connectDB();

    // Check how many users have email preferences
    const usersWithPreferences = await User.countDocuments({
      emailPreferences: { $exists: true }
    });

    if (usersWithPreferences === 0) {
      console.log('✅ No users have email preferences. Nothing to remove.');
      return;
    }

    console.log(`📊 Found ${usersWithPreferences} users with email preferences.`);
    
    // Remove email preferences from all users
    const result = await User.updateMany(
      { emailPreferences: { $exists: true } },
      {
        $unset: {
          emailPreferences: ""
        }
      }
    );

    console.log(`✅ Successfully removed email preferences from ${result.modifiedCount} users.`);
    
    // Verify removal
    const remainingUsers = await User.countDocuments({
      emailPreferences: { $exists: true }
    });
    
    if (remainingUsers === 0) {
      console.log('✅ All email preferences have been successfully removed.');
    } else {
      console.log(`⚠️ ${remainingUsers} users still have email preferences. You may need to run this again.`);
    }

  } catch (error) {
    console.error('\n❌ Failed to remove email preferences:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Main execution logic
const command = process.argv[2];

switch (command) {
  case 'migrate':
    addEmailVerificationFields();
    break;
  case 'check':
    checkMigrationStatus();
    break;
  case 'rollback':
    rollbackMigration();
    break;
  case 'remove-preferences':
    removeEmailPreferences();
    break;
  default:
    console.log('\n📧 Email Verification Fields Migration Script');
    console.log('\nUsage:');
    console.log('  npm run migrate:email-verification migrate           - Run the migration');
    console.log('  npm run migrate:email-verification check             - Check migration status');
    console.log('  npm run migrate:email-verification rollback          - Rollback migration');
    console.log('  npm run migrate:email-verification remove-preferences - Remove email preferences only');
    console.log('\nOptions:');
    console.log('  --force  - Force migration even if already run');
    break;
} 