/**
 * Complete Workflow Integration Test
 * Tests the entire teacher → AI → student → submission flow
 * 
 * Run: node test-workflow.js
 */

const BASE_URL = 'http://localhost:3001';

// Test data
const TEST_ASSIGNMENT_ID = `test_assign_${Date.now()}`;
const TEST_TEACHER_ID = 'teacher_test_001';
const TEST_STUDENT_ID = 'test_student_001';
const TEST_CLASS_ID = 'class_test_001';

const TEST_QUESTIONS = [
  {
    id: "q1",
    questionText: "Solve for x: 2x + 5 = 15",
    questionType: "numerical",
    correctAnswer: "5",
    points: 10
  },
  {
    id: "q2",
    questionText: "What is the slope of the line passing through (2,3) and (4,7)?",
    questionType: "numerical",
    correctAnswer: "2",
    points: 10
  },
  {
    id: "q3",
    questionText: "Explain the concept of a variable in algebra.",
    questionType: "short_answer",
    correctAnswer: "",
    points: 10
  },
  {
    id: "q4",
    questionText: "Which of the following is a linear equation?",
    questionType: "mcq",
    options: ["x² + 2x = 5", "2x + 3 = 7", "x³ = 8", "√x = 4"],
    correctAnswer: "2x + 3 = 7",
    points: 10
  },
  {
    id: "q5",
    questionText: "Simplify: 3(x + 2) - 2(x - 1)",
    questionType: "short_answer",
    correctAnswer: "x + 8",
    points: 10
  },
  {
    id: "q6",
    questionText: "What is the y-intercept of y = 3x + 4?",
    questionType: "numerical",
    correctAnswer: "4",
    points: 10
  },
  {
    id: "q7",
    questionText: "Solve: 5x - 3 = 2x + 9",
    questionType: "numerical",
    correctAnswer: "4",
    points: 10
  },
  {
    id: "q8",
    questionText: "Write an equation for a line with slope 2 passing through (0,5)",
    questionType: "short_answer",
    correctAnswer: "y = 2x + 5",
    points: 10
  },
  {
    id: "q9",
    questionText: "If 3x + 7 = 22, what is x?",
    questionType: "numerical",
    correctAnswer: "5",
    points: 10
  },
  {
    id: "q10",
    questionText: "Describe how to solve a two-step equation.",
    questionType: "long_answer",
    correctAnswer: "",
    points: 10
  }
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWorkflow() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     COMPLETE WORKFLOW INTEGRATION TEST                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  let questionSetId, assignmentId;

  try {
    // ═══════════════════════════════════════════════════════════
    // STEP 1: Teacher Creates Assignment
    // ═══════════════════════════════════════════════════════════
    console.log('📝 STEP 1: Teacher Creates Assignment');
    console.log('   Creating assignment with 10 questions...');
    
    const createResponse = await fetch(`${BASE_URL}/api/assignments/create-with-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignmentId: TEST_ASSIGNMENT_ID,
        teacherId: TEST_TEACHER_ID,
        classId: TEST_CLASS_ID,
        subject: "Mathematics",
        topic: "Algebra Basics",
        grade: "10",
        questions: TEST_QUESTIONS,
        assignmentRules: {
          totalQuestions: 10,
          questionsToAttempt: 5,
          allowStudentChoice: true,
          submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        personalizationEnabled: true,
        personalizationLevel: "moderate"
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Create failed: ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    questionSetId = createData.questionSetId;
    assignmentId = TEST_ASSIGNMENT_ID;

    console.log(`   ✅ Assignment created: ${questionSetId}`);
    console.log(`   📊 Difficulty: Easy: ${createData.summary.difficultyDistribution.easy}, ` +
                `Medium: ${createData.summary.difficultyDistribution.medium}, ` +
                `Hard: ${createData.summary.difficultyDistribution.hard}`);
    console.log(`   🧠 Avg Bloom's Level: ${createData.summary.averageBloomsLevel}`);
    console.log('');

    await sleep(1000);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Create/Check Student Learning Profile
    // ═══════════════════════════════════════════════════════════
    console.log('👤 STEP 2: Student Learning Profile');
    console.log('   Checking/creating student profile...');
    
    // Try to get existing profile
    const checkProfileResponse = await fetch(`${BASE_URL}/api/learning-profile?studentId=${TEST_STUDENT_ID}&classId=${TEST_CLASS_ID}`);
    
    if (checkProfileResponse.ok) {
      console.log('   ✅ Student profile already exists');
    } else {
      // Create new profile
      const profileResponse = await fetch(`${BASE_URL}/api/learning-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: TEST_STUDENT_ID,
          classId: TEST_CLASS_ID,
          grade: "10",
          subjects: ["Mathematics"],
          onboardingMetrics: {
            cognitive_depth_preference: 3,
            challenge_resilience: 3,
            subject_affinity_map: { math: 4, science: 3, language: 3 },
            learning_pace_self_assessment: 3,
            help_seeking_tendency: 3
          }
        })
      });
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(`Profile creation failed: ${JSON.stringify(errorData)}`);
      }
      
      console.log('   ✅ Student profile created successfully');
    }
    console.log('');

    await sleep(1000);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: AI Personalizes Questions for Student
    // ═══════════════════════════════════════════════════════════
    console.log('🤖 STEP 3: AI Personalizes Questions');
    console.log('   Generating personalized variants...');
    
    const personalizeResponse = await fetch(`${BASE_URL}/api/assignments/personalize-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionSetId,
        studentIds: [TEST_STUDENT_ID],
        assignmentId
      })
    });

    if (!personalizeResponse.ok) {
      throw new Error(`Personalize failed: ${personalizeResponse.status}`);
    }

    const personalizeData = await personalizeResponse.json();
    
    // Check if personalization succeeded
    if (!personalizeData.success || !personalizeData.results[TEST_STUDENT_ID] || !personalizeData.results[TEST_STUDENT_ID].success) {
      console.error('   ❌ Personalization failed:', personalizeData);
      throw new Error(`Personalization failed: ${JSON.stringify(personalizeData.results[TEST_STUDENT_ID])}`);
    }
    
    console.log(`   ✅ Questions personalized for ${TEST_STUDENT_ID}`);
    console.log(`   📝 Variants created: ${personalizeData.results[TEST_STUDENT_ID].variantsCreated}`);
    console.log('');

    await sleep(1000);

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Student Views Personalized Questions
    // ═══════════════════════════════════════════════════════════
    console.log('👁️  STEP 4: Student Views Questions');
    console.log('   Fetching personalized questions...');
    
    const viewResponse = await fetch(
      `${BASE_URL}/api/assignments/personalize-questions?studentId=${TEST_STUDENT_ID}&assignmentId=${assignmentId}`
    );

    if (!viewResponse.ok) {
      throw new Error(`View failed: ${viewResponse.status}`);
    }

    const viewData = await viewResponse.json();
    console.log(`   ✅ Received ${viewData.totalQuestions} personalized questions`);
    console.log('');

    await sleep(1000);

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Student Chooses 5 Questions
    // ═══════════════════════════════════════════════════════════
    console.log('🎯 STEP 5: Student Selects Questions');
    console.log('   Recording question choices (5 out of 10)...');
    
    const choiceResponse = await fetch(`${BASE_URL}/api/assignments/record-choice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: TEST_STUDENT_ID,
        questionSetId,
        assignmentId,
        chosenQuestionIds: ["q1", "q2", "q4", "q6", "q9"],
        choiceTimeline: [
          { questionId: "q1", action: "viewed", timestamp: new Date().toISOString() },
          { questionId: "q1", action: "selected", timestamp: new Date().toISOString() },
          { questionId: "q2", action: "viewed", timestamp: new Date().toISOString() },
          { questionId: "q2", action: "selected", timestamp: new Date().toISOString() },
          { questionId: "q4", action: "selected", timestamp: new Date().toISOString() },
          { questionId: "q6", action: "selected", timestamp: new Date().toISOString() },
          { questionId: "q9", action: "selected", timestamp: new Date().toISOString() },
          { questionId: "all", action: "finalized", timestamp: new Date().toISOString() }
        ]
      })
    });

    if (!choiceResponse.ok) {
      throw new Error(`Choice failed: ${choiceResponse.status}`);
    }

    const choiceData = await choiceResponse.json();
    console.log(`   ✅ Choices recorded and analyzed`);
    console.log(`   📊 Choice Quality: ${choiceData.analysis.qualityScore}/100`);
    console.log(`   💪 Confidence Score: ${choiceData.analysis.metricScores.confidenceScore}`);
    console.log(`   🧠 Strategic Thinking: ${choiceData.analysis.metricScores.strategicThinking}`);
    console.log(`   🎯 Self-Awareness: ${choiceData.analysis.metricScores.selfAwareness}`);
    console.log('');

    await sleep(1000);

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Student Submits Answers
    // ═══════════════════════════════════════════════════════════
    console.log('✍️  STEP 6: Student Submits Answers');
    console.log('   Submitting answers to 5 questions...');
    
    const submitResponse = await fetch(`${BASE_URL}/api/assignments/submit-answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: TEST_STUDENT_ID,
        assignmentId,
        answers: [
          {
            masterQuestionId: "q1",
            studentAnswer: "5",
            timeSpent: 120,
            hintsUsed: 1,
            hintsViewed: ["Subtract 5 from both sides"],
            confidence: "high"
          },
          {
            masterQuestionId: "q2",
            studentAnswer: "2",
            timeSpent: 90,
            hintsUsed: 0,
            hintsViewed: [],
            confidence: "high"
          },
          {
            masterQuestionId: "q4",
            studentAnswer: "2x + 3 = 7",
            timeSpent: 60,
            hintsUsed: 0,
            hintsViewed: [],
            confidence: "high"
          },
          {
            masterQuestionId: "q6",
            studentAnswer: "4",
            timeSpent: 45,
            hintsUsed: 0,
            hintsViewed: [],
            confidence: "high"
          },
          {
            masterQuestionId: "q9",
            studentAnswer: "5",
            timeSpent: 75,
            hintsUsed: 1,
            hintsViewed: ["Subtract 7 from both sides first"],
            confidence: "medium"
          }
        ]
      })
    });

    if (!submitResponse.ok) {
      throw new Error(`Submit failed: ${submitResponse.status}`);
    }

    const submitData = await submitResponse.json();
    console.log(`   ✅ Assignment submitted successfully`);
    console.log(`   📊 Score: ${submitData.summary.totalScore}/${submitData.summary.maxPossibleScore} (${submitData.summary.percentage}%)`);
    console.log(`   ✅ Correct Answers: ${submitData.summary.correctAnswers}/${submitData.summary.totalQuestions}`);
    console.log(`   📈 Accuracy: ${submitData.summary.accuracy}%`);
    console.log('');
    console.log('   📊 Metrics Updated:');
    console.log(`      • Concept Mastery: ${submitData.metricsUpdated.conceptMasteryRate}%`);
    console.log(`      • Learning Pace: ${submitData.metricsUpdated.learningPace}/10`);
    console.log(`      • ZPD Level: ${submitData.metricsUpdated.zpdLevel}`);
    console.log('');

    // ═══════════════════════════════════════════════════════════
    // SUCCESS
    // ═══════════════════════════════════════════════════════════
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           ✅ WORKFLOW TEST COMPLETED SUCCESSFULLY          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Summary:');
    console.log(`  • Assignment ID: ${assignmentId}`);
    console.log(`  • Question Set ID: ${questionSetId}`);
    console.log(`  • Student Score: ${submitData.summary.percentage}%`);
    console.log(`  • All API endpoints working correctly`);
    console.log(`  • AI integration functioning`);
    console.log(`  • Metrics updated successfully`);
    console.log('');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Run the test
console.log('Starting workflow test...\n');
testWorkflow().then(() => {
  console.log('Test completed successfully! ✅');
  process.exit(0);
}).catch(error => {
  console.error('Test failed! ❌', error);
  process.exit(1);
});

