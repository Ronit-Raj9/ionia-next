/**
 * Comprehensive Demo Data for Classes 9 & 10 Science
 * Realistic Indian CBSE curriculum-aligned data
 */

import { ObjectId } from 'mongodb';

// School and Teacher IDs
export const DEMO_SCHOOL_ID = 'demo-school-delhi-2025';
export const DEMO_TEACHER_ID = 'teacher_demo_1';
export const DEMO_TEACHER_NAME = 'Mrs. Sharma';

// Class 9 Science Topics (CBSE)
export const CLASS_9_TOPICS = [
  'Matter in Our Surroundings',
  'Is Matter Around Us Pure',
  'Atoms and Molecules',
  'Structure of Atom',
  'Motion',
  'Force and Laws of Motion',
  'Gravitation',
  'Work and Energy',
  'Sound',
  'Why Do We Fall Ill',
  'Natural Resources',
  'Improvement in Food Resources'
];

// Class 10 Science Topics (CBSE)
export const CLASS_10_TOPICS = [
  'Chemical Reactions and Equations',
  'Acids, Bases and Salts',
  'Metals and Non-Metals',
  'Carbon and its Compounds',
  'Periodic Classification of Elements',
  'Light - Reflection and Refraction',
  'Human Eye and Colourful World',
  'Electricity',
  'Magnetic Effects of Electric Current',
  'Sources of Energy',
  'Our Environment',
  'Management of Natural Resources'
];

// Generate realistic Indian student names
export const STUDENT_NAMES = [
  { first: 'Aarav', last: 'Sharma', gender: 'male' },
  { first: 'Diya', last: 'Patel', gender: 'female' },
  { first: 'Arjun', last: 'Singh', gender: 'male' },
  { first: 'Ananya', last: 'Reddy', gender: 'female' },
  { first: 'Vihaan', last: 'Kumar', gender: 'male' },
  { first: 'Aisha', last: 'Khan', gender: 'female' },
  { first: 'Reyansh', last: 'Mehta', gender: 'male' },
  { first: 'Saanvi', last: 'Nair', gender: 'female' },
  { first: 'Aditya', last: 'Gupta', gender: 'male' },
  { first: 'Navya', last: 'Iyer', gender: 'female' },
  { first: 'Kabir', last: 'Joshi', gender: 'male' },
  { first: 'Myra', last: 'Das', gender: 'female' },
  { first: 'Ishaan', last: 'Verma', gender: 'male' },
  { first: 'Aadhya', last: 'Rao', gender: 'female' },
  { first: 'Ayaan', last: 'Saxena', gender: 'male' },
  { first: 'Kiara', last: 'Bose', gender: 'female' },
  { first: 'Vivaan', last: 'Pillai', gender: 'male' },
  { first: 'Sara', last: 'Menon', gender: 'female' },
  { first: 'Sai', last: 'Kapoor', gender: 'male' },
  { first: 'Riya', last: 'Desai', gender: 'female' }
];

// Sample Science Questions by Topic (Class 9)
export const SAMPLE_QUESTIONS_CLASS_9 = {
  'Gravitation': [
    'State the universal law of gravitation and express it in mathematical form.',
    'Calculate the force between two objects of masses 80 kg and 1200 kg kept at a distance of 10 m from each other. (G = 6.7 × 10⁻¹¹ Nm²/kg²)',
    'Why do we not feel the gravitational force between two people standing near each other?',
    'What is the difference between mass and weight? Why is weight zero at the centre of the Earth?',
    'Calculate the weight of a 10 kg object on the Moon, given that acceleration due to gravity on Moon is 1.6 m/s².'
  ],
  'Work and Energy': [
    'Define work. When is work said to be done by a force?',
    'A force of 20 N displaces an object through 5 m in the direction of force. Calculate the work done.',
    'Explain the difference between kinetic energy and potential energy with examples.',
    'Derive the expression for kinetic energy of an object of mass m moving with velocity v.',
    'A body of mass 2 kg is thrown vertically upwards with an initial velocity of 20 m/s. Calculate its potential energy at the highest point. (g = 10 m/s²)'
  ],
  'Atoms and Molecules': [
    'State Dalton\'s atomic theory. What are its limitations?',
    'Calculate the number of molecules present in 36 grams of water (H₂O). (Atomic mass: H=1, O=16)',
    'What is the difference between an atom and a molecule?',
    'Define valency and write the valency of first 20 elements.',
    'Write the chemical formula for: (a) Sodium chloride (b) Carbon dioxide (c) Calcium carbonate'
  ]
};

// Sample Science Questions by Topic (Class 10)
export const SAMPLE_QUESTIONS_CLASS_10 = {
  'Electricity': [
    'State Ohm\'s law and express it mathematically. Draw a circuit diagram to verify Ohm\'s law.',
    'A wire of resistance 5Ω is connected to a battery of 6V. Calculate the current flowing through the wire and the heat produced in 10 seconds.',
    'Explain the difference between series and parallel circuits with diagrams.',
    'Three resistors of 2Ω, 3Ω and 6Ω are connected in parallel. Calculate the equivalent resistance.',
    'Define electric power and derive the expression P = V²/R.'
  ],
  'Light - Reflection and Refraction': [
    'State the laws of reflection of light.',
    'A ray of light is incident on a plane mirror at an angle of 30°. What will be the angle of reflection?',
    'Define refractive index of a medium. Light enters from air into glass of refractive index 1.5. Calculate the speed of light in glass if speed in air is 3 × 10⁸ m/s.',
    'Draw a ray diagram to show the formation of image by a concave mirror when object is placed between focus and pole.',
    'A convex lens of focal length 20 cm forms an image at a distance of 30 cm. Calculate the object distance using lens formula.'
  ],
  'Chemical Reactions and Equations': [
    'What is a balanced chemical equation? Why should chemical equations be balanced?',
    'Write a balanced equation for the reaction: Zinc + Sulphuric acid → Zinc sulphate + Hydrogen',
    'Identify the type of reaction in the following: CaCO₃ → CaO + CO₂',
    'What is the difference between oxidation and reduction? Give examples.',
    'Write the balanced chemical equation for photosynthesis and identify which substance is oxidized and which is reduced.'
  ]
};

// Generate diverse OCEAN personality profiles
export function generateDiverseOceanProfiles(count: number = 20) {
  const profiles = [];
  
  for (let i = 0; i < count; i++) {
    const studentName = STUDENT_NAMES[i % STUDENT_NAMES.length];
    const studentId = `student_demo_${i + 1}`;
    
    // Create diverse personalities
    // Some high performers, some average, some struggling
    const profileType = i < 5 ? 'high_performer' : i < 15 ? 'average' : 'struggling';
    
    let oceanTraits;
    let learningPrefs;
    let topicMasteries;
    
    if (profileType === 'high_performer') {
      oceanTraits = {
        openness: 70 + Math.random() * 30, // 70-100
        conscientiousness: 75 + Math.random() * 25, // 75-100
        extraversion: 40 + Math.random() * 60, // 40-100
        agreeableness: 60 + Math.random() * 40, // 60-100
        neuroticism: 10 + Math.random() * 30 // 10-40 (low anxiety)
      };
      topicMasteries = 75 + Math.random() * 25; // 75-100%
    } else if (profileType === 'average') {
      oceanTraits = {
        openness: 40 + Math.random() * 40, // 40-80
        conscientiousness: 40 + Math.random() * 40, // 40-80
        extraversion: 30 + Math.random() * 60, // 30-90
        agreeableness: 50 + Math.random() * 40, // 50-90
        neuroticism: 30 + Math.random() * 40 // 30-70
      };
      topicMasteries = 50 + Math.random() * 30; // 50-80%
    } else { // struggling
      oceanTraits = {
        openness: 30 + Math.random() * 40, // 30-70
        conscientiousness: 20 + Math.random() * 40, // 20-60
        extraversion: 20 + Math.random() * 60, // 20-80
        agreeableness: 40 + Math.random() * 50, // 40-90
        neuroticism: 50 + Math.random() * 50 // 50-100 (high anxiety)
      };
      topicMasteries = 20 + Math.random() * 40; // 20-60%
    }
    
    // Round all values
    oceanTraits = {
      openness: Math.round(oceanTraits.openness),
      conscientiousness: Math.round(oceanTraits.conscientiousness),
      extraversion: Math.round(oceanTraits.extraversion),
      agreeableness: Math.round(oceanTraits.agreeableness),
      neuroticism: Math.round(oceanTraits.neuroticism)
    };
    
    // Derive learning preferences
    learningPrefs = {
      visualLearner: oceanTraits.openness > 60,
      kinestheticLearner: oceanTraits.openness > 70 && oceanTraits.extraversion > 50,
      auditoryLearner: oceanTraits.extraversion > 60,
      readingWritingLearner: oceanTraits.conscientiousness > 60 && oceanTraits.openness < 50,
      preferredDifficulty: topicMasteries > 75 ? 'hard' : topicMasteries > 50 ? 'medium' : 'easy',
      needsStepByStepGuidance: oceanTraits.conscientiousness < 50 || oceanTraits.neuroticism > 60,
      respondsToEncouragement: oceanTraits.neuroticism > 50 || oceanTraits.conscientiousness < 50
    };
    
    // Derive intellectual traits
    const intellectualTraits = {
      analyticalThinking: Math.round(oceanTraits.conscientiousness * 0.6 + (100 - oceanTraits.neuroticism) * 0.4),
      creativeThinking: Math.round(oceanTraits.openness * 0.7 + oceanTraits.extraversion * 0.3),
      criticalThinking: Math.round(oceanTraits.conscientiousness * 0.5 + oceanTraits.openness * 0.3 + (100 - oceanTraits.neuroticism) * 0.2),
      problemSolvingSkill: Math.round(oceanTraits.openness * 0.4 + oceanTraits.conscientiousness * 0.3 + (100 - oceanTraits.neuroticism) * 0.3)
    };
    
    profiles.push({
      studentMockId: studentId,
      studentName: `${studentName.first} ${studentName.last}`,
      schoolId: DEMO_SCHOOL_ID,
      oceanTraits,
      learningPreferences: learningPrefs,
      intellectualTraits,
      personalityTestCompleted: true,
      testTakenDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
      subjectMastery: [
        {
          subject: 'Science',
          grade: i < 10 ? '9' : '10',
          topics: [],
          overallMasteryScore: Math.round(topicMasteries)
        }
      ],
      assignmentHistory: [],
      previousPerformance: {
        subject: 'Science',
        weaknesses: profileType === 'struggling' ? ['formula-application', 'numerical-problems'] : [],
        masteryScores: {}
      },
      personalityProfile: {
        type: learningPrefs.visualLearner ? 'visual' : learningPrefs.auditoryLearner ? 'auditory' : learningPrefs.kinestheticLearner ? 'kinesthetic' : 'reading',
        quizResponses: []
      },
      intellectualProfile: {
        strengths: profileType === 'high_performer' ? ['analytical-thinking', 'problem-solving'] : ['effort', 'persistence'],
        responsePatterns: []
      },
      engagementMetrics: {
        completionRate: profileType === 'high_performer' ? 95 : profileType === 'average' ? 80 : 65,
        badgeCount: Math.floor(Math.random() * 10),
        progressChains: [],
        streakDays: Math.floor(Math.random() * 15),
        totalTimeSpent: Math.floor(Math.random() * 3600)
      },
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      updatedAt: new Date()
    });
  }
  
  return profiles;
}

// Generate demo classes
export function generateDemoClasses() {
  return [
    {
      _id: new ObjectId(),
      className: 'Class 9 Science - Section A',
      teacherMockId: DEMO_TEACHER_ID,
      schoolId: DEMO_SCHOOL_ID,
      studentMockIds: Array.from({ length: 10 }, (_, i) => `student_demo_${i + 1}`),
      description: 'CBSE Class 9 Science - Complete syllabus coverage with practical experiments',
      subject: 'Science',
      grade: '9',
      syllabus: 'CBSE' as const,
      isActive: true,
      joinCode: 'SCI9A2025',
      currentTopic: 'Gravitation',
      completedTopics: ['Matter in Our Surroundings', 'Atoms and Molecules', 'Motion', 'Force and Laws of Motion'],
      upcomingTopics: ['Work and Energy', 'Sound', 'Why Do We Fall Ill'],
      studyMaterialLinks: [
        {
          bookTitle: 'NCERT Science Class 9',
          publisher: 'NCERT',
          fileUrl: '/demo/ncert-science-class9.pdf',
          chapters: [
            {
              number: 10,
              title: 'Gravitation',
              topics: ['Universal Law of Gravitation', 'Free Fall', 'Weight', 'Thrust and Pressure', 'Archimedes Principle'],
              indexed: true
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      _id: new ObjectId(),
      className: 'Class 10 Science - Section B',
      teacherMockId: DEMO_TEACHER_ID,
      schoolId: DEMO_SCHOOL_ID,
      studentMockIds: Array.from({ length: 10 }, (_, i) => `student_demo_${i + 11}`),
      description: 'CBSE Class 10 Science - Board exam preparation with focus on numericals',
      subject: 'Science',
      grade: '10',
      syllabus: 'CBSE' as const,
      isActive: true,
      joinCode: 'SCI10B2025',
      currentTopic: 'Electricity',
      completedTopics: ['Chemical Reactions', 'Acids and Bases', 'Metals and Non-Metals', 'Carbon Compounds', 'Light'],
      upcomingTopics: ['Magnetic Effects', 'Sources of Energy', 'Our Environment'],
      studyMaterialLinks: [
        {
          bookTitle: 'NCERT Science Class 10',
          publisher: 'NCERT',
          fileUrl: '/demo/ncert-science-class10.pdf',
          chapters: [
            {
              number: 12,
              title: 'Electricity',
              topics: ['Electric Current', 'Electric Potential', 'Ohms Law', 'Resistance', 'Electric Power'],
              indexed: true
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ];
}

// Generate sample assignments
export function generateDemoAssignments(classId: string, grade: '9' | '10', studentIds: string[]) {
  const topic = grade === '9' ? 'Gravitation' : 'Electricity';
  const questions = grade === '9' ? SAMPLE_QUESTIONS_CLASS_9['Gravitation'] : SAMPLE_QUESTIONS_CLASS_10['Electricity'];
  
  return {
    _id: new ObjectId(),
    classId,
    schoolId: DEMO_SCHOOL_ID,
    taskType: 'assignment',
    title: `${topic} - Numerical Problems`,
    description: `Practice assignment covering key concepts in ${topic}`,
    subject: 'Science',
    grade,
    topic,
    difficulty: 'medium' as const,
    totalMarks: 100,
    assignmentType: 'personalized' as const,
    originalContent: {
      questions
    },
    baseSolution: {
      solutionText: 'Detailed solutions provided in class notes. Refer to NCERT textbook Chapter ' + (grade === '9' ? '10' : '12'),
      solutionFileUrl: '/demo/solutions.pdf'
    },
    gradingRubric: {
      criteria: [
        { name: 'Correct Formula', points: 30, description: 'Student used the correct formula' },
        { name: 'Substitution', points: 20, description: 'Correct substitution of values' },
        { name: 'Calculation', points: 30, description: 'Accurate calculations' },
        { name: 'Units', points: 10, description: 'Correct units mentioned' },
        { name: 'Final Answer', points: 10, description: 'Final answer is correct' }
      ],
      aiGenerated: true
    },
    createdBy: DEMO_TEACHER_ID,
    assignedTo: studentIds,
    gradeSettings: {
      showMarksToStudents: true,
      showFeedbackToStudents: true
    },
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    maxScore: 100,
    isPublished: true,
    personalizationEnabled: true,
    personalizedVersions: [],
    submissionStats: {
      totalStudents: studentIds.length,
      submitted: 0,
      graded: 0,
      pending: studentIds.length
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date()
  };
}

export default {
  DEMO_SCHOOL_ID,
  DEMO_TEACHER_ID,
  DEMO_TEACHER_NAME,
  CLASS_9_TOPICS,
  CLASS_10_TOPICS,
  STUDENT_NAMES,
  SAMPLE_QUESTIONS_CLASS_9,
  SAMPLE_QUESTIONS_CLASS_10,
  generateDiverseOceanProfiles,
  generateDemoClasses,
  generateDemoAssignments
};
