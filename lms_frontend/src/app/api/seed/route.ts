import { NextRequest, NextResponse } from 'next/server';
import { getCollection, COLLECTIONS, User, Class, StudentProfile, Assignment, Progress } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action !== 'seed') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Clear existing data
    await clearCollections();

    // Seed data
    await seedUsers();
    await seedClasses();
    await seedStudentProfiles();
    await seedSampleAssignments();
    await seedProgress();

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with demo data',
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
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
      email: 'teacher@demo.com',
      classId: 'demo-class-1',
      createdAt: new Date(),
    },
    {
      role: 'admin',
      mockUserId: 'admin1',
      email: 'admin@demo.com',
      classId: 'demo-class-1',
      createdAt: new Date(),
    },
  ];

  // Add 20 students
  for (let i = 1; i <= 20; i++) {
    users.push({
      role: 'student',
      mockUserId: `student${i}`,
      email: `student${i}@demo.com`,
      classId: 'demo-class-1',
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
    studentMockIds: Array.from({ length: 20 }, (_, i) => `student${i + 1}`),
    createdAt: new Date(),
  };

  await classesCollection.insertOne(demoClass);
}

async function seedStudentProfiles() {
  const profilesCollection = await getCollection(COLLECTIONS.STUDENT_PROFILES);
  
  const weaknessOptions = ['algebra', 'fractions', 'decimals', 'geometry', 'word-problems', 'equations'];
  const personalityTypes = ['visual', 'analytical', 'collaborative', 'independent', 'creative'];
  const strengthOptions = ['logical', 'creative', 'methodical', 'intuitive', 'detail-oriented'];

  const profiles: StudentProfile[] = [];

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

    profiles.push({
      studentMockId: `student${i}`,
      classId: 'demo-class-1',
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
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      personalizedVersions: [], // Will be populated when assignments are created
    },
    {
      classId: 'demo-class-1',
      taskType: 'math',
      originalContent: {
        questions: [
          'Solve the quadratic equation: x² - 5x + 6 = 0',
          'Find the perimeter of a triangle with sides 5cm, 12cm, and 13cm',
          'Calculate 15% of 240',
          'Solve for x: 3(x - 2) = 15',
        ],
      },
      createdBy: 'teacher1',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      personalizedVersions: [],
    },
    {
      classId: 'demo-class-1',
      taskType: 'math',
      originalContent: {
        questions: [
          'Graph the linear equation: y = 2x + 3',
          'Find the slope of the line passing through points (2, 4) and (6, 12)',
          'Solve the system: x + y = 10, x - y = 2',
        ],
      },
      createdBy: 'teacher1',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      personalizedVersions: [],
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
