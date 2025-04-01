// Migration script to add resetPasswordToken and resetPasswordExpires fields to User model
import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name using ES module approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../../.env') });

// Import the DB_NAME constant
import { DB_NAME } from '../../constants.js';

const runMigration = async () => {
  try {
    // Connect to MongoDB database using the same approach as db.js
    const DATABASE_ATLAS = process.env.DATABASE_ATLAS;
    if (!DATABASE_ATLAS) {
      throw new Error('DATABASE_ATLAS is not defined in environment variables');
    }

    // Construct connection string the same way as in db.js
    const dbUri = DATABASE_ATLAS.replace("<DB_NAME>", DB_NAME);
    console.log('Connecting to MongoDB with URI:', dbUri);
    
    // Connect to database
    await mongoose.connect(dbUri);
    console.log(`Connected to MongoDB successfully: ${mongoose.connection.host}`);

    // Get the User collection
    const userCollection = mongoose.connection.collection('users');
    
    // Log current document count
    const userCount = await userCollection.countDocuments();
    console.log(`Found ${userCount} user documents in the database`);

    // Update schema by adding the new fields to all existing documents
    console.log('Adding resetPasswordToken and resetPasswordExpires fields to all User documents...');
    
    const updateResult = await userCollection.updateMany(
      // Find documents that don't have these fields
      { 
        $or: [
          { resetPasswordToken: { $exists: false } },
          { resetPasswordExpires: { $exists: false } }
        ] 
      },
      // Add the fields with null/undefined values
      { 
        $set: { 
          resetPasswordToken: null,
          resetPasswordExpires: null
        } 
      }
    );

    console.log(`Migration complete: ${updateResult.modifiedCount} documents updated`);
    
    // Verify schema update
    const sampleUser = await userCollection.findOne({});
    console.log('Sample user document after migration:');
    console.log(JSON.stringify(sampleUser, null, 2));

    return 'Migration completed successfully';
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close the database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
  }
};

// Run the migration
runMigration()
  .then((result) => {
    console.log(result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in migration:', error);
    process.exit(1);
  }); 