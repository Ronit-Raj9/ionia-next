import { MongoClient, Db, Collection } from 'mongodb';

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
  const db = client.db('EduFlowDB');
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
  _id?: string;
  role: 'teacher' | 'student' | 'admin';
  mockUserId: string;
  email?: string;
  classId: string;
  createdAt: Date;
}

export interface Class {
  _id?: string;
  className: string;
  teacherMockId: string;
  studentMockIds: string[];
  createdAt: Date;
}

export interface StudentProfile {
  _id?: string;
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
  updatedAt: Date;
}

export interface Assignment {
  _id?: string;
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
}

export interface Submission {
  _id?: string;
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
}

export interface Progress {
  _id?: string;
  studentMockId: string;
  classId: string;
  metrics: {
    mastery: Record<string, number>;
    weaknesses: string[];
    timeSaved: number;
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
}

export default clientPromise;
