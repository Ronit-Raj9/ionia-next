import axios from 'axios';

export interface TestAnalytics {
  totalTests: number;
  totalQuestions: number;
  activeUsers: number;
  totalStudents: number;
  testsBySubject: Record<string, number>;
  completionRates: Record<string, number>;
  recentTests: Array<{
    id: string;
    title: string;
    questions: number;
    attempts: number;
    createdAt: string;
  }>;
  recentQuestions: Array<{
    id: string;
    title: string;
    subject: string;
    createdAt: string;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const fetchTestAnalytics = async (): Promise<TestAnalytics> => {
  try {
    const response = await axios.get(`${API_URL}/api/v1/admin/analytics`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}; 