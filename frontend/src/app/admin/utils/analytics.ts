import axios from 'axios';

export interface TestAnalytics {
  totalTests: number;
  totalQuestions: number;
  activeUsers: number;
  testsBySubject: { [key: string]: number };
  completionRates: { [key: string]: number };
  recentTests: Array<{
    id: string;
    title: string;
    questions: number;
    attempts: number;
    createdAt: string;
  }>;
}

export async function fetchTestAnalytics(): Promise<TestAnalytics> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    
    // Fetch data from your actual API endpoints
    const [questionsResponse, testsResponse] = await Promise.all([
      fetch(`${API_URL}/questions/get`, {
        credentials: 'include',
      }),
      fetch(`${API_URL}/previous-year-papers/get`, {
        credentials: 'include',
      })
    ]);

    if (!questionsResponse.ok || !testsResponse.ok) {
      throw new Error('Failed to fetch analytics data');
    }

    const questionsData = await questionsResponse.json();
    const testsData = await testsResponse.json();

    // Process the data
    const questions = questionsData.data || [];
    const tests = testsData.data || [];

    // Calculate analytics
    const totalTests = tests.length;
    const totalQuestions = questions.length;
    
    // Calculate tests by subject
    const testsBySubject = tests.reduce((acc: { [key: string]: number }, test: any) => {
      const subject = test.subject || 'Other';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {});

    // Calculate completion rates (based on attempts)
    const completionRates = tests.reduce((acc: { [key: string]: number }, test: any) => {
      const attempts = test.attempts || 0;
      const totalPossible = test.totalPossible || 1;
      acc[test.id] = (attempts / totalPossible) * 100;
      return acc;
    }, {});

    // Get 5 most recent tests
    const recentTests = tests
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((test: any) => ({
        id: test.id,
        title: test.title,
        questions: test.questions?.length || 0,
        attempts: test.attempts || 0,
        createdAt: test.createdAt,
      }));

    return {
      totalTests,
      totalQuestions,
      activeUsers: 0, // This can be updated if you have an endpoint for active users
      testsBySubject,
      completionRates,
      recentTests,
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
} 