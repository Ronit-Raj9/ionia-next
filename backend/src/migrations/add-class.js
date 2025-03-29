import mongoose from 'mongoose';
import { Question } from '../models/question.model.js';
import 'dotenv/config';
import { DB_NAME } from '../constants.js';

/**
 * Migration script to add class field to existing questions
 * 
 * This script:
 * 1. Connects to the MongoDB database
 * 2. Finds all questions
 * 3. Sets default class based on examType:
 *    - For JEE/NEET related exams: class_11 or class_12
 *    - For CBSE exams: corresponding class
 *    - For others: none
 * 4. Updates each question
 * 5. Outputs progress and results
 */

const migrateClass = async () => {
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
    let classCounts = {
      class_9: 0,
      class_10: 0,
      class_11: 0,
      class_12: 0,
      none: 0
    };

    // Process questions in batches using cursor for memory efficiency
    const cursor = Question.find({}).cursor();

    for (let question = await cursor.next(); question != null; question = await cursor.next()) {
      try {
        // Determine the appropriate class based on examType
        let defaultClass = 'none';
        
        if (question.examType) {
          switch (question.examType) {
            case 'jee_main':
            case 'jee_adv':
            case 'neet':
              // For these exams, default to class 12 if not specified
              defaultClass = 'class_12';
              break;
            case 'cbse_11':
              defaultClass = 'class_11';
              break;
            case 'cbse_12':
              defaultClass = 'class_12';
              break;
            case 'cuet':
              // CUET is typically for class 12
              defaultClass = 'class_12';
              break;
            default:
              defaultClass = 'none';
          }
        }

        // Set the class if not already set
        if (!question.class) {
          question.class = defaultClass;
          await question.save();
          updatedCount++;
          classCounts[defaultClass]++;
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
    console.log('\nClass distribution:');
    Object.entries(classCounts).forEach(([className, count]) => {
      console.log(`${className}: ${count} questions`);
    });

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
migrateClass().then(() => {
  console.log('Class migration script completed');
  process.exit(0);
}).catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
}); 