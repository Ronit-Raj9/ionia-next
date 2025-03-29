import mongoose from 'mongoose';
import { Question } from '../models/question.model.js';
import 'dotenv/config';
import { DB_NAME } from '../constants.js';

/**
 * Combined migration script to update class, section, and questionCategory fields
 * 
 * This script:
 * 1. Connects to the MongoDB database
 * 2. Finds all questions
 * 3. Updates all three fields together:
 *    - Sets class based on examType
 *    - Sets section to 'none' if not set
 *    - Sets questionCategory based on questionType
 * 4. Updates each question
 * 5. Outputs progress and results
 */

const updateQuestionFields = async () => {
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
    let sectionCounts = {
      none: 0
    };
    let categoryCounts = {
      theoretical: 0,
      numerical: 0
    };
    let sourceCounts = {
      custom: 0,
      india_book: 0,
      foreign_book: 0,
      pyq: 0
    };

    // Process questions in batches using cursor for memory efficiency
    const cursor = Question.find({}).cursor();

    for (let question = await cursor.next(); question != null; question = await cursor.next()) {
      try {
        let needsUpdate = false;

        // Determine the appropriate class based on examType
        let defaultClass = 'none';
        if (question.examType) {
          switch (question.examType) {
            case 'jee_main':
            case 'jee_adv':
            case 'neet':
              defaultClass = 'class_12';
              break;
            case 'cbse_11':
              defaultClass = 'class_11';
              break;
            case 'cbse_12':
              defaultClass = 'class_12';
              break;
            case 'cuet':
              defaultClass = 'class_12';
              break;
            default:
              defaultClass = 'none';
          }
        }

        // Set class if not already set
        if (!question.class) {
          question.class = defaultClass;
          needsUpdate = true;
          classCounts[defaultClass]++;
        }

        // Set section to 'none' if not set
        if (!question.section) {
          question.section = 'none';
          needsUpdate = true;
          sectionCounts.none++;
        }

        // Set questionCategory based on questionType
        if (!question.questionCategory) {
          question.questionCategory = question.questionType === 'numerical' ? 'numerical' : 'theoretical';
          needsUpdate = true;
          categoryCounts[question.questionCategory]++;
        }

        // Set questionSource to 'custom' if not set
        if (!question.questionSource) {
          question.questionSource = 'custom';
          needsUpdate = true;
          sourceCounts.custom++;
        }

        // Save only if changes were made
        if (needsUpdate) {
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
    
    console.log('\nClass distribution:');
    Object.entries(classCounts).forEach(([className, count]) => {
      console.log(`${className}: ${count} questions`);
    });

    console.log('\nSection distribution:');
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`${section}: ${count} questions`);
    });

    console.log('\nQuestion Category distribution:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`${category}: ${count} questions`);
    });

    console.log('\nQuestion Source distribution:');
    Object.entries(sourceCounts).forEach(([source, count]) => {
      console.log(`${source}: ${count} questions`);
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
updateQuestionFields().then(() => {
  console.log('Question fields update migration completed');
  process.exit(0);
}).catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
}); 