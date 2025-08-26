// ==========================================
// 🧠 TEST SERVICES LAYER - BUSINESS LOGIC
// ==========================================

import { fetchWithAuth } from '@/features/auth/api/authApi';

// Get the API base URL
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://3.7.73.172/api/v1';
};

const API_BASE = getApiBaseUrl();
console.log("API_BASE", API_BASE);
// API Response interface
interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ==========================================
// 🏷️ TYPE DEFINITIONS
// ==========================================

export interface Test {
  _id: string;
  title: string;
  description?: string;
  testCategory: 'PYQ' | 'Platform' | 'UserCustom';
  status: 'draft' | 'published' | 'archived';
  subject: string;
  examType: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  markingScheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  questions: string[]; // Question IDs
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // PYQ specific fields
  year?: number;
  month?: string;
  day?: string;
  session?: string;
  // Platform specific fields
  platformTestType?: string;
  isPremium?: boolean;
  syllabus?: string;
}

export interface TestForAttempt {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  examType: string;
  difficulty: string;
  duration: number;
  totalQuestions: number;
  time: number;
  markingScheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  year?: number;
  platformTestType?: string;
  session?: string;
  questions: QuestionForAttempt[];
}

export interface QuestionForAttempt {
  _id: string;
  question: {
    text: string;
    image?: string;
  };
  options: Array<{
    text: string;
    image?: string;
  }>;
  subject: string;
  examType: string;
  difficulty: string;
  userAnswer?: number;
  isMarked: boolean;
  timeTaken: number;
  isVisited: boolean;
}

export interface TestSubmission {
  testId: string;
  language?: string;
  startTime: string;
  endTime: string;
  totalTimeTaken: number;
  answers: Array<{
    questionId: string;
    answerOptionIndex?: number;
    timeSpent: number;
  }>;
  metadata?: {
    visitedQuestions: string[];
    answeredQuestions: string[];
    markedForReview: string[];
    selectedLanguage?: string;
  };
  questionStates?: {
    notVisited: string[];
    notAnswered: string[];
    answered: string[];
    markedForReview: string[];
    markedAndAnswered: string[];
  };
  navigationHistory?: Array<{
    timestamp: string;
    questionId: string;
    action: string;
    timeSpent: number;
  }>;
  environment?: {
    device: {
      userAgent: string;
      screenResolution: string;
      deviceType: string;
    };
    session: {
      tabSwitches: number;
      disconnections: Array<{
        startTime: string;
        endTime: string;
        duration: number;
      }>;
      browserRefreshes: number;
    };
  };
}

export interface TestAnalysis {
  testInfo: {
    testId: string;
    attemptId: string;
    testTitle: string;
    testCategory: string;
    language: string;
    duration: number;
    startTime: string;
    endTime: string;
    markingScheme: {
      correct: number;
      incorrect: number;
      unattempted: number;
    };
  };
  attempts: Array<{
    id: string;
    number: number;
    score: number;
    date: string;
  }>;
  answers: Array<{
    questionId: string;
    selectedOption?: number;
    timeSpent: number;
    isCorrect: boolean;
    correctAnswer: number[];
  }>;
  metadata: {
    questions: Array<{
      id: string;
      subject: string;
      topic: string;
      difficulty: string;
      correctOption: string;
    }>;
  };
  performance: {
    totalQuestions: number;
    totalCorrectAnswers: number;
    totalWrongAnswers: number;
    totalUnattempted: number;
    score: number;
    percentage: number;
    totalVisitedQuestions: number;
    totalTimeTaken: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
  };
  timeAnalytics: {
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    questionTimeDistribution: {
      lessThan30Sec: string[];
      between30To60Sec: string[];
      between1To2Min: string[];
      moreThan2Min: string[];
    };
  };
  subjectWise: Record<string, {
    total: number;
    attempted: number;
    correct: number;
    timeSpent: number;
  }>;
  questionStates: {
    notVisited: string[];
    notAnswered: string[];
    answered: string[];
    markedForReview: string[];
    markedAndAnswered: string[];
  };
  navigationHistory: Array<{
    timestamp: string;
    questionId: string;
    action: string;
    timeSpent: number;
  }>;
  environment: {
    device: {
      userAgent: string;
      screenResolution: string;
      deviceType: string;
    };
    session: {
      tabSwitches: number;
      disconnections: Array<{
        startTime: string;
        endTime: string;
        duration: number;
      }>;
      browserRefreshes: number;
    };
  };
}

export interface TestFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  testCategory?: string;
  status?: string;
  subject?: string;
  examType?: string;
  class?: string;
  difficulty?: string;
  platformTestType?: string;
  year?: number;
  isPremium?: boolean;
  createdBy?: string;
  tag?: string;
  fetchAll?: boolean;
}

export interface CreateTestData {
  title: string;
  description?: string;
  tags?: string[];
  testCategory: 'PYQ' | 'Platform' | 'UserCustom';
  status?: 'draft' | 'published' | 'archived';
  instructions?: string;
  solutionsVisibility?: boolean;
  attemptsAllowed?: number;
  questions: string[];
  duration: number;
  markingScheme?: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  subject: string;
  examType: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  // PYQ specific
  year?: number;
  month?: string;
  day?: string;
  session?: string;
  // Platform specific
  platformTestType?: string;
  isPremium?: boolean;
  syllabus?: string;
}

// ==========================================
// 🎯 TEST SERVICES IMPLEMENTATION
// ==========================================

export class TestService {
  // ==========================================
  // 📋 TEST MANAGEMENT
  // ==========================================

  /**
   * Get all tests with filtering and pagination
   */
  static async getTests(filters: TestFilters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      

      // Always use the standard tests endpoint with proper filtering
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/tests?${queryParams.toString()}`, { method: 'GET' });
      console.log('TestService.getTests - API Response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching tests:', error);
      throw new Error('Failed to fetch tests');
    }
  }

  /**
   * Get a single test by ID
   */
  static async getTestById(testId: string, examType?: string): Promise<Test> {
    try {
      // Always use the standard endpoint
      const url = `${API_BASE}/v1/tests/${testId}`;
      console.log('TestService.getTestById - URL:', url);
      
      const response = await fetchWithAuth<APIResponse<Test>>(url, { method: 'GET' });
      console.log('TestService.getTestById - Response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching test:', error);
      throw new Error('Failed to fetch test');
    }
  }

  /**
   * Create a new test
   */
  static async createTest(testData: CreateTestData): Promise<Test> {
    try {
      const response = await fetchWithAuth<APIResponse<Test>>(`${API_BASE}/v1/tests`, {
        method: 'POST',
        body: JSON.stringify(testData)
      });
      return response.data;
    } catch (error) {
      console.error('Error creating test:', error);
      throw new Error('Failed to create test');
    }
  }

  /**
   * Update an existing test
   */
  static async updateTest(testId: string, updateData: Partial<CreateTestData>): Promise<Test> {
    try {
      const response = await fetchWithAuth<APIResponse<Test>>(`${API_BASE}/v1/tests/${testId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      return response.data;
    } catch (error) {
      console.error('Error updating test:', error);
      throw new Error('Failed to update test');
    }
  }

  /**
   * Delete a test
   */
  static async deleteTest(testId: string): Promise<void> {
    try {
      await fetchWithAuth(`${API_BASE}/v1/tests/${testId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting test:', error);
      throw new Error('Failed to delete test');
    }
  }

  // ==========================================
  // 🎯 TEST ATTEMPTS
  // ==========================================

  /**
   * Get a test prepared for attempting (without answers)
   */
  static async getTestForAttempt(testId: string, examType?: string): Promise<TestForAttempt> {
    try {
      // Always use the standard endpoint
      const url = `${API_BASE}/v1/tests/${testId}/attempt`;
      console.log('TestService.getTestForAttempt - URL:', url);
      
      const response = await fetchWithAuth<APIResponse<TestForAttempt>>(url, { method: 'GET' });
      console.log('TestService.getTestForAttempt - Response:', response);
      return response.data;
    } catch (error) {
      console.error('Error fetching test for attempt:', error);
      throw new Error('Failed to fetch test for attempt');
    }
  }

  /**
   * Submit test answers and get analysis
   */
  static async submitTest(submission: TestSubmission): Promise<{
    attemptId: string;
    analysisUrl: string;
  }> {
    try {
      const response = await fetchWithAuth<APIResponse<{
        attemptId: string;
        analysisUrl: string;
      }>>(`${API_BASE}/v1/attempted-tests/submit`, {
        method: 'POST',
        body: JSON.stringify(submission)
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting test:', error);
      throw new Error('Failed to submit test');
    }
  }

  // ==========================================
  // 📊 TEST ANALYSIS
  // ==========================================

  /**
   * Get detailed test analysis
   */
  static async getTestAnalysis(attemptId: string, paperId?: string): Promise<TestAnalysis> {
    try {
      const params = new URLSearchParams();
      if (attemptId) params.append('attemptId', attemptId);
      if (paperId) params.append('paperId', paperId);

      const response = await fetchWithAuth<APIResponse<TestAnalysis>>(`${API_BASE}/v1/attempted-tests/analysis?${params.toString()}`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching test analysis:', error);
      throw new Error('Failed to fetch test analysis');
    }
  }

  /**
   * Get time analytics for a test
   */
  static async getTimeAnalytics(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/attempted-tests/time-analytics?testId=${testId}`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching time analytics:', error);
      throw new Error('Failed to fetch time analytics');
    }
  }

  /**
   * Get error analysis for a test
   */
  static async getErrorAnalysis(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/attempted-tests/error-analysis?testId=${testId}`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching error analysis:', error);
      throw new Error('Failed to fetch error analysis');
    }
  }

  /**
   * Get navigation patterns for a test
   */
  static async getNavigationPatterns(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}v1/attempted-tests/navigation-patterns?testId=${testId}`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching navigation patterns:', error);
      throw new Error('Failed to fetch navigation patterns');
    }
  }

  /**
   * Get difficulty analysis for a test
   */
  static async getDifficultyAnalysis(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/attempted-tests/difficulty-analysis?testId=${testId}`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching difficulty analysis:', error);
      throw new Error('Failed to fetch difficulty analysis');
    }
  }

  /**
   * Get interaction metrics for a test
   */
  static async getInteractionMetrics(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/attempted-tests/interaction-metrics?testId=${testId}`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching interaction metrics:', error);
      throw new Error('Failed to fetch interaction metrics');
    }
  }

  /**
   * Get performance trends across multiple attempts
   */
  static async getPerformanceTrends(testId?: string) {
    try {
      const params = testId ? `?testId=${testId}` : '';
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/attempted-tests/performance-trends${params}`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      throw new Error('Failed to fetch performance trends');
    }
  }

  /**
   * Get subject-wise analysis
   */
  static async getSubjectAnalysis() {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/attempted-tests/subject-analysis`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching subject analysis:', error);
      throw new Error('Failed to fetch subject analysis');
    }
  }

  /**
   * Get solutions for a test attempt
   */
  static async getSolutions(attemptId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/attempted-tests/solutions/${attemptId}`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching solutions:', error);
      throw new Error('Failed to fetch solutions');
    }
  }

  /**
   * Delete a test attempt
   */
  static async deleteTestAttempt(attemptId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/attempted-tests/delete/${attemptId}`, { method: 'DELETE' });
      return response.data;
    } catch (error) {
      console.error('Error deleting test attempt:', error);
      throw new Error('Failed to delete test attempt');
    }
  }

  // ==========================================
  // 📈 ANALYTICS
  // ==========================================

  /**
   * Get test analytics for admin dashboard
   */
  static async getTestAnalytics(): Promise<any> {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(`${API_BASE}/v1/analytics/tests`, { method: 'GET' });
      return response.data;
    } catch (error) {
      console.error('Error fetching test analytics:', error);
      throw new Error('Failed to fetch test analytics');
    }
  }

  // ==========================================
  // 🔧 UTILITY METHODS
  // ==========================================

  /**
   * Calculate test score based on answers and marking scheme
   */
  static calculateScore(
    answers: Array<{ isCorrect: boolean }>,
    markingScheme: { correct: number; incorrect: number; unattempted: number },
    totalQuestions: number
  ): number {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const wrongAnswers = answers.filter(a => !a.isCorrect).length;
    const unattempted = totalQuestions - correctAnswers - wrongAnswers;

    return (
      correctAnswers * markingScheme.correct +
      wrongAnswers * markingScheme.incorrect +
      unattempted * markingScheme.unattempted
    );
  }

  /**
   * Calculate percentage score
   */
  static calculatePercentage(score: number, totalMarks: number): number {
    return totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  }

  /**
   * Format time duration
   */
  static formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Validate test submission data
   */
  static validateSubmission(submission: TestSubmission): boolean {
    if (!submission.testId) return false;
    if (!Array.isArray(submission.answers)) return false;
    if (submission.totalTimeTaken < 0) return false;
    return true;
  }
}

// ==========================================
// 📤 EXPORTS
// ==========================================

export default TestService;
