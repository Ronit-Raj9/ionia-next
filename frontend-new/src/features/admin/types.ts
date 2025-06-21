export interface TestItem {
  id: string;
  title: string;
  questions: number;
  attempts: number;
  createdAt: string;
}

export interface QuestionItem {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
}

export interface AdminAnalytics {
  totalTests: number;
  totalQuestions: number;
  activeUsers: number;
  totalStudents: number;
  testsBySubject: Record<string, number>;
  completionRates: Record<string, number>;
  recentTests: TestItem[];
  recentQuestions: QuestionItem[];
}

export interface User {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin';
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  avatar?: string;
  analytics?: {
    totalTests: number;
    testsThisWeek: number;
    averageScore: number;
    accuracy: number;
  };
}

export interface UserAnalytics {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}

export interface PaginatedUsers {
  docs: User[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}
