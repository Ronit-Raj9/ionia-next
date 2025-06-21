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

export interface TestAnalytics {
  totalTests: number;
  totalQuestions: number;
  activeUsers: number;
  totalStudents: number;
  testsBySubject: Record<string, number>;
  completionRates: Record<string, number>;
  recentTests: TestItem[];
  recentQuestions: QuestionItem[];
} 