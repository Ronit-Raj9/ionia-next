import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Database connection helper
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise;
  const db = client.db('IoniaDB');
  return { client, db };
}

// Collection helpers
export async function getCollection(collectionName: string): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// Collection names constants
export const COLLECTIONS = {
  USERS: 'users',
  CLASSES: 'classes',
  STUDENT_PROFILES: 'studentProfiles',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
  PROGRESS: 'progress',
} as const;

// Database schemas/interfaces
export interface User {
  _id?: ObjectId;
  role: 'teacher' | 'student' | 'admin';
  mockUserId: string;
  email?: string;
  classId: string;
  dashboardPreferences?: {
    theme: string;
    preferredSubjects: string[];
  };
  createdAt: Date;
}

export interface Class {
  _id?: ObjectId;
  className: string;
  teacherMockId: string;
  studentMockIds: string[];
  analyticsHistory?: {
    timestamp: Date;
    summary: {
      averageScore: number;
      topWeakness: string;
      completionRate: number;
    };
  }[];
  createdAt: Date;
}

export interface StudentProfile {
  _id?: ObjectId;
  studentMockId: string;
  previousPerformance: {
    subject: string;
    weaknesses: string[];
    masteryScores: Record<string, number>;
  };
  personalityProfile: {
    type: string;
    quizResponses: string[];
  };
  intellectualProfile: {
    strengths: string[];
    responsePatterns: string[];
  };
  engagementMetrics?: {
    completionRate: number;
    badgeCount: number;
    progressChains: {
      chainId: string;
      status: 'in_progress' | 'mastered' | 'locked';
    }[];
    streakDays: number;
    totalTimeSpent: number;
  };
  updatedAt: Date;
}

export interface Assignment {
  _id?: ObjectId;
  classId: string;
  taskType: string;
  originalContent: {
    questions: string[];
  };
  uploadedFileUrl?: string;
  createdBy: string;
  createdAt: Date;
  personalizedVersions: {
    studentMockId: string;
    adaptedContent: {
      questions: string[];
      variations: string;
    };
  }[];
  suggestions?: {
    recommendedTask: string;
    basedOn: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number;
  }[];
}

export interface Submission {
  _id?: ObjectId;
  assignmentId: string;
  studentMockId: string;
  submittedContent: {
    text: string;
    imageUrls: string[];
  };
  submissionTime: Date;
  grade: {
    score: number;
    feedback: string;
    errors: string[];
  };
  processed: boolean;
  hintUsage?: number;
  chainLink?: string;
  timeSpent?: number;
}

export interface Progress {
  _id?: ObjectId;
  studentMockId: string;
  classId: string;
  metrics: {
    mastery: Record<string, number>;
    weaknesses: string[];
    timeSaved: number;
    strengths?: string[];
    averageScore?: number;
    completionRate?: number;
    totalSubmissions?: number;
  };
  updates: {
    timestamp: Date;
    change: string;
  }[];
  heatmapData: {
    weaknesses: {
      topic: string;
      percentage: number;
    }[];
  };
  advancedMetrics?: {
    scoreUplift: number;
    parentSummary: string;
    learningVelocity: number;
    conceptMastery: Record<string, number>;
  };
  reportExports?: {
    format: 'PDF' | 'Excel';
    url: string;
    generatedAt: Date;
    type: 'progress' | 'analytics' | 'parent_summary';
  }[];
  gamificationData?: {
    badges: string[];
    progressBars: Record<string, number>;
    achievements: {
      name: string;
      earnedAt: Date;
      description: string;
    }[];
  };
  recentActivity?: {
    type: 'submission' | 'badge_earned' | 'mastery_achieved';
    description: string;
    timestamp: Date;
  }[];
}

export default clientPromise;
