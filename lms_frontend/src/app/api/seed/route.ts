import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, User, Class, StudentProfile, Assignment, Progress } from '@/lib/db';
import {
  DEMO_SCHOOL_ID,
  DEMO_TEACHER_ID,
  DEMO_TEACHER_NAME,
  STUDENT_NAMES,
  generateDiverseOceanProfiles,
  generateDemoClasses,
  generateDemoAssignments
} from '@/lib/demo-seed-data';

export async function POST(request: NextRequest) {
  try {
    const { action, useScience = true } = await request.json();

    if (action !== 'seed') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Clear existing data
    await clearCollections();

    if (useScience) {
      // Use new comprehensive Science demo data with OCEAN traits
      await seedScienceDemo();
    } else {
      // Use original math demo data (legacy)
      await seedUsers();
      await seedClasses();
      await seedStudentProfiles();
      await seedSampleAssignments();
      await seedProgress();
    }

    return NextResponse.json({
      success: true,
      message: useScience ? 
        'Database seeded successfully with Science (Classes 9 & 10) demo data with OCEAN personality profiles' :
        'Database seeded successfully with Math demo data',
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}

async function seedScienceDemo() {
  console.log('Seeding Science demo data with OCEAN profiles...');
  
  // 1. Seed teacher and student users
  const usersCollection = await getCollection(COLLECTIONS.USERS);
  const users: User[] = [
    {
      role: 'teacher',
      mockUserId: DEMO_TEACHER_ID,
      name: DEMO_TEACHER_NAME,
      email: 'teacher.demo@school.com',
      classId: 'demo-class-9a',
      schoolId: DEMO_SCHOOL_ID,
      createdAt: new Date(),
    },
    {
      role: 'admin',
      mockUserId: 'admin_demo',
      name: 'Admin Demo User',
      email: 'admin.demo@school.com',
      classId: 'demo-class-9a',
      schoolId: DEMO_SCHOOL_ID,
      createdAt: new Date(),
    }
  ];

  // Add 20 students (10 for Class 9, 10 for Class 10)
  for (let i = 0; i < 20; i++) {
    const student = STUDENT_NAMES[i % STUDENT_NAMES.length];
    users.push({
      role: 'student',
      mockUserId: `student_demo_${i + 1}`,
      name: `${student.first} ${student.last}`,
      email: `${student.first.toLowerCase()}.${student.last.toLowerCase()}@student.com`,
      classId: i < 10 ? 'demo-class-9a' : 'demo-class-10b',
      schoolId: DEMO_SCHOOL_ID,
      dashboardPreferences: {
        theme: 'light',
        preferredSubjects: ['Science']
      },
      createdAt: new Date(),
    });
  }
  
  await usersCollection.insertMany(users);
  console.log('✓ Users seeded');

  // 2. Skip hardcoded classes - let teachers create their own
  console.log('✓ Skipping hardcoded classes - teachers will create their own');

  // 3. Seed student profiles with OCEAN traits
  const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
  const studentProfiles = generateDiverseOceanProfiles(20);
  await profilesCollection.insertMany(studentProfiles as any[]);
  console.log('✓ Student profiles with OCEAN traits seeded');

  // 4. Skip hardcoded assignments - teachers will create their own
  console.log('✓ Skipping hardcoded assignments - teachers will create their own');

  // 5. Skip initial progress data - will be created when students submit assignments
  console.log('✓ Skipping initial progress data - will be created dynamically');

  console.log('✅ Dynamic demo data seeding complete!');
  console.log(`   - 1 Teacher: ${DEMO_TEACHER_NAME} (${DEMO_TEACHER_ID})`);
  console.log(`   - 20 Students: Each with unique OCEAN personality profiles`);
  console.log(`   - 0 Classes: Teachers will create their own classes`);
  console.log(`   - 0 Assignments: Teachers will create assignments for their classes`);
  console.log(`   - All students ready for class enrollment and personalized learning`);
}

async function clearCollections() {
  const collections = [
    COLLECTIONS.USERS,
    COLLECTIONS.CLASSES,
    COLLECTIONS.STUDENT_PROFILES,
    COLLECTIONS.ASSIGNMENTS,
    COLLECTIONS.SUBMISSIONS,
    COLLECTIONS.PROGRESS,
  ];

  for (const collectionName of collections) {
    const collection = await getCollection(collectionName);
    await collection.deleteMany({});
  }
}

async function seedUsers() {
  const usersCollection = await getCollection(COLLECTIONS.USERS);
  
  const users: User[] = [
    {
      role: 'teacher',
      mockUserId: 'teacher1',
      name: 'Demo Teacher',
      email: 'teacher@demo.com',
      classId: 'demo-class-1',
      schoolId: 'CBSE001',
      createdAt: new Date(),
    },
    {
      role: 'admin',
      mockUserId: 'admin1',
      name: 'Demo Admin',
      email: 'admin@demo.com',
      classId: 'demo-class-1',
      schoolId: 'CBSE001',
      createdAt: new Date(),
    },
  ];

  // Add 20 students with different school IDs for demo
  const schoolIds = ['CBSE001', 'ICSE123', 'KENDRIYA001', 'STATE456'];
  for (let i = 1; i <= 20; i++) {
    const schoolId = schoolIds[i % schoolIds.length]; // Distribute students across different schools
    users.push({
      role: 'student',
      mockUserId: `student${i}`,
      name: `Student ${i}`,
      email: `student${i}@demo.com`,
      classId: 'demo-class-1',
      schoolId: schoolId,
      createdAt: new Date(),
    });
  }

  await usersCollection.insertMany(users);
}

async function seedClasses() {
  const classesCollection = await getCollection(COLLECTIONS.CLASSES);
  
  const demoClass: Class = {
    className: 'Math Demo Class - Grade 10',
    teacherMockId: 'teacher1',
    schoolId: 'CBSE001',
    studentMockIds: Array.from({ length: 20 }, (_, i) => `student${i + 1}`),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await classesCollection.insertOne(demoClass);
}

async function seedStudentProfiles() {
  const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
  
  const weaknessOptions = ['algebra', 'fractions', 'decimals', 'geometry', 'word-problems', 'equations'];
  const personalityTypes = ['visual', 'analytical', 'collaborative', 'independent', 'creative'];
  const strengthOptions = ['logical', 'creative', 'methodical', 'intuitive', 'detail-oriented'];

  const profiles: StudentProfile[] = [];
  const schoolIds = ['CBSE001', 'ICSE123', 'KENDRIYA001', 'STATE456'];

  for (let i = 1; i <= 20; i++) {
    // Randomly assign 2-3 weaknesses
    const shuffledWeaknesses = [...weaknessOptions].sort(() => 0.5 - Math.random());
    const weaknesses = shuffledWeaknesses.slice(0, Math.floor(Math.random() * 2) + 2);
    
    // Random personality type
    const personalityType = personalityTypes[Math.floor(Math.random() * personalityTypes.length)];
    
    // Random 1-2 strengths
    const shuffledStrengths = [...strengthOptions].sort(() => 0.5 - Math.random());
    const strengths = shuffledStrengths.slice(0, Math.floor(Math.random() * 2) + 1);
    
    // Generate mastery scores (0-100)
    const masteryScores: Record<string, number> = {};
    weaknessOptions.forEach(topic => {
      if (weaknesses.includes(topic)) {
        masteryScores[topic] = Math.floor(Math.random() * 40) + 30; // 30-70 for weak areas
      } else {
        masteryScores[topic] = Math.floor(Math.random() * 30) + 70; // 70-100 for strong areas
      }
    });

    const schoolId = schoolIds[i % schoolIds.length]; // Distribute students across different schools

    profiles.push({
      studentMockId: `student${i}`,
      schoolId: schoolId,
      // OCEAN Personality Traits (default balanced values)
      oceanTraits: {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50
      },
      // Learning Preferences (default balanced)
      learningPreferences: {
        visualLearner: true,
        kinestheticLearner: false,
        auditoryLearner: false,
        readingWritingLearner: false,
        preferredDifficulty: 'medium' as const,
        needsStepByStepGuidance: false,
        respondsToEncouragement: true
      },
      // Intellectual Traits (default balanced)
      intellectualTraits: {
        analyticalThinking: 50,
        creativeThinking: 50,
        criticalThinking: 50,
        problemSolvingSkill: 50
      },
      // Subject Mastery (empty for new students)
      subjectMastery: [],
      // Assignment History (empty for new students)
      assignmentHistory: [],
      // Personality Test Status
      personalityTestCompleted: false,
      // Legacy fields for backward compatibility
      previousPerformance: {
        subject: 'mathematics',
        weaknesses,
        masteryScores,
      },
      personalityProfile: {
        type: personalityType,
        quizResponses: [
          'I prefer visual explanations',
          'I like working step by step',
          'I learn better with examples',
          'I need time to think',
          'I like solving problems',
        ],
      },
      intellectualProfile: {
        strengths,
        responsePatterns: [
          'Shows work clearly',
          'Asks clarifying questions',
          'Makes connections between concepts',
        ],
      },
      updatedAt: new Date(),
    });
  }

  await profilesCollection.insertMany(profiles);
}

async function seedSampleAssignments() {
  const assignmentsCollection = await getCollection(COLLECTIONS.ASSIGNMENTS);
  
  const sampleAssignments: Assignment[] = [
    {
      classId: 'demo-class-1',
      taskType: 'math',
      title: 'Algebra Basics Practice',
      description: 'Practice fundamental algebra concepts including equations, area calculations, and fractions.',
      subject: 'Math',
      grade: '10',
      topic: 'Algebra',
      difficulty: 'medium' as const,
      totalMarks: 100,
      assignmentType: 'standard' as const,
      originalContent: {
        questions: [
          'Solve for x: 2x + 5 = 13',
          'Calculate the area of a rectangle with length 8cm and width 5cm',
          'Simplify: 3/4 + 1/8',
          'Find the value of y when x = 3 in the equation y = 2x - 1',
          'Convert 0.75 to a fraction in lowest terms',
        ],
      },
      createdBy: 'teacher1',
      assignedTo: ['student1', 'student2', 'student3', 'student4', 'student5'],
      gradeSettings: {
        showMarksToStudents: true,
        showFeedbackToStudents: true
      },
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      maxScore: 100,
      isPublished: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      personalizationEnabled: true,
      personalizedVersions: [], // Will be populated when assignments are created
      submissionStats: {
        totalStudents: 5,
        submitted: 0,
        graded: 0,
        pending: 0
      }
    },
    {
      classId: 'demo-class-1',
      taskType: 'math',
      title: 'Intermediate Math Problems',
      description: 'More advanced problems including quadratic equations, geometry, and percentages.',
      subject: 'Math',
      grade: '10',
      topic: 'Quadratic Equations',
      difficulty: 'hard' as const,
      totalMarks: 120,
      assignmentType: 'standard' as const,
      originalContent: {
        questions: [
          'Solve the quadratic equation: x² - 5x + 6 = 0',
          'Find the perimeter of a triangle with sides 5cm, 12cm, and 13cm',
          'Calculate 15% of 240',
          'Solve for x: 3(x - 2) = 15',
        ],
      },
      createdBy: 'teacher1',
      assignedTo: ['student11', 'student12', 'student13', 'student14', 'student15'],
      gradeSettings: {
        showMarksToStudents: true,
        showFeedbackToStudents: true
      },
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      maxScore: 120,
      isPublished: true,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      personalizationEnabled: true,
      personalizedVersions: [],
      submissionStats: {
        totalStudents: 5,
        submitted: 0,
        graded: 0,
        pending: 0
      }
    },
    {
      classId: 'demo-class-1',
      taskType: 'math',
      title: 'Linear Equations and Graphing',
      description: 'Practice with linear equations, slope calculations, and system solving.',
      subject: 'Math',
      grade: '10',
      topic: 'Linear Equations',
      difficulty: 'medium' as const,
      totalMarks: 90,
      assignmentType: 'standard' as const,
      originalContent: {
        questions: [
          'Graph the linear equation: y = 2x + 3',
          'Find the slope of the line passing through points (2, 4) and (6, 12)',
          'Solve the system: x + y = 10, x - y = 2',
        ],
      },
      createdBy: 'teacher1',
      assignedTo: ['student16', 'student17', 'student18', 'student19', 'student20'],
      gradeSettings: {
        showMarksToStudents: false,
        showFeedbackToStudents: false
      },
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      maxScore: 90,
      isPublished: true,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      personalizationEnabled: true,
      personalizedVersions: [],
      submissionStats: {
        totalStudents: 5,
        submitted: 0,
        graded: 0,
        pending: 0
      }
    },
  ];

  await assignmentsCollection.insertMany(sampleAssignments);
}

async function seedProgress() {
  const progressCollection = await getCollection(COLLECTIONS.PROGRESS);
  
  const progressRecords: Progress[] = [];

  for (let i = 1; i <= 20; i++) {
    const studentMockId = `student${i}`;
    
    // Generate random progress data
    const overallMastery = Math.floor(Math.random() * 40) + 60; // 60-100
    const weaknessTopics = ['algebra', 'fractions', 'geometry'];
    const randomWeaknesses = weaknessTopics.filter(() => Math.random() < 0.4);

    progressRecords.push({
      studentMockId,
      classId: 'demo-class-1',
      metrics: {
        mastery: {
          overall: overallMastery,
          algebra: Math.floor(Math.random() * 50) + 50,
          fractions: Math.floor(Math.random() * 50) + 50,
          geometry: Math.floor(Math.random() * 50) + 50,
        },
        weaknesses: randomWeaknesses,
        timeSaved: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
      },
      updates: [
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          change: 'Initial assessment completed',
        },
        {
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          change: `Mastery improved to ${overallMastery}%`,
        },
      ],
      heatmapData: {
        weaknesses: [
          { topic: 'algebra', percentage: 45 },
          { topic: 'fractions', percentage: 35 },
          { topic: 'geometry', percentage: 25 },
          { topic: 'word-problems', percentage: 55 },
        ],
      },
    });
  }

  await progressCollection.insertMany(progressRecords);
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Seed endpoint available. POST with {"action": "seed"} to populate database.',
  });
}
