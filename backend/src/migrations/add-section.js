import mongoose from 'mongoose';
import { Question } from '../models/question.model.js';
import 'dotenv/config';
import { DB_NAME } from '../constants.js';

/**
 * Migration script to add section field to existing questions
 * 
 * This script:
 * 1. Connects to the MongoDB database
 * 2. Finds all questions
 * 3. Sets default section based on subject:
 *    - For subjects that require sections, sets section to 'none' if not set
 *    - For other subjects, sets section to 'none'
 * 4. Updates each question
 * 5. Outputs progress and results
 */

const migrateSection = async () => {
  try {
    // Connect to MongoDB using the same connection logic as db.js
    console.log('Connecting to database...');
    const dbUri = process.env.DATABASE_ATLAS.replace("<DB_NAME>", DB_NAME);
    console.log("Connection started with: " , dbUri);
    const connectionInstance = await mongoose.connect(dbUri);
    console.log(`\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);

    // Get total count for progress tracking
    const totalQuestions = await Question.countDocuments({});
    console.log(`Found ${totalQuestions} questions to update`);

    // Initialize counters
    let updatedCount = 0;
    let errorCount = 0;

    // Process questions in batches using cursor for memory efficiency
    const cursor = Question.find({}).cursor();

    for (let question = await cursor.next(); question != null; question = await cursor.next()) {
      try {
        // Set default section to 'none' if not set
        if (!question.section) {
          question.section = 'none';
          await question.save();
          updatedCount++;
        }

        // Show progress every 100 questions
        if (updatedCount % 100 === 0) {
          console.log(`Progress: ${updatedCount}/${totalQuestions} (${(updatedCount/totalQuestions*100).toFixed(2)}%)`);
        }
      } catch (err) {
        console.error(`Error updating question ${question._id}:`, err.message);
        errorCount++;
      }
    }

    // Output final results
    console.log('\nMigration complete:');
    console.log(`Total questions processed: ${updatedCount}`);
    console.log(`Errors encountered: ${errorCount}`);

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
migrateSection().then(() => {
  console.log('Section migration script completed');
  process.exit(0);
}).catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
}); 