// ==========================================
// 🧠 ANALYSIS SERVICES LAYER - BUSINESS LOGIC
// ==========================================

import { fetchWithAuth } from '@/features/auth/api/authApi';
import { AnalysisData, QuestionAnalysis, SubjectPerformance, TimeAnalysis, DifficultyAnalysis } from '../store/analysisStore';

// Get the API base URL
const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://3.7.73.172/api/v1';
};

const API_BASE = getApiBaseUrl();

// API Response interface
interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// ==========================================
// 🏷️ TYPE DEFINITIONS
// ==========================================

export interface TestAnalysisResponse {
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

// ==========================================
// 🎯 ANALYSIS SERVICES IMPLEMENTATION
// ==========================================

export class AnalysisService {
  // ==========================================
  // 📊 TEST ANALYSIS
  // ==========================================

  /**
   * Get detailed test analysis by attempt ID
   */
  static async getTestAnalysis(attemptId: string, paperId?: string): Promise<TestAnalysisResponse> {
    try {
      const params = new URLSearchParams();
      if (attemptId) params.append('attemptId', attemptId);
      if (paperId) params.append('paperId', paperId);

      const response = await fetchWithAuth<APIResponse<TestAnalysisResponse>>(
        `${API_BASE}/attempted-tests/analysis?${params.toString()}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch test analysis');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching test analysis:', error);
      throw new Error('Failed to fetch test analysis');
    }
  }

  /**
   * Get analysis data for a specific test
   */
  static async getAnalysisData(testId: string): Promise<AnalysisData> {
    try {
      const response = await fetchWithAuth<APIResponse<AnalysisData>>(
        `${API_BASE}/analytics/test/${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch analysis data');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      throw new Error('Failed to fetch analysis data');
    }
  }

  /**
   * Get user's analysis history
   */
  static async getAnalysisHistory(): Promise<AnalysisData[]> {
    try {
      const response = await fetchWithAuth<APIResponse<AnalysisData[]>>(
        `${API_BASE}/analytics/history`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch analysis history');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      throw new Error('Failed to fetch analysis history');
    }
  }

  // ==========================================
  // 📈 PERFORMANCE ANALYTICS
  // ==========================================

  /**
   * Get performance trends
   */
  static async getPerformanceTrends(testId?: string) {
    try {
      const params = testId ? `?testId=${testId}` : '';
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/performance-trends${params}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch performance trends');
      }
      
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
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/subject-analysis`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch subject analysis');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching subject analysis:', error);
      throw new Error('Failed to fetch subject analysis');
    }
  }

  /**
   * Get difficulty analysis
   */
  static async getDifficultyAnalysis(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/difficulty-analysis?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch difficulty analysis');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching difficulty analysis:', error);
      throw new Error('Failed to fetch difficulty analysis');
    }
  }

  // ==========================================
  // ⏱️ TIME ANALYTICS
  // ==========================================

  /**
   * Get time analytics for a test
   */
  static async getTimeAnalytics(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/time-analytics?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch time analytics');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching time analytics:', error);
      throw new Error('Failed to fetch time analytics');
    }
  }

  /**
   * Get time efficiency metrics
   */
  static async getTimeEfficiencyMetrics(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/time-efficiency?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch time efficiency metrics');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching time efficiency metrics:', error);
      throw new Error('Failed to fetch time efficiency metrics');
    }
  }

  // ==========================================
  // 🔍 ERROR ANALYSIS
  // ==========================================

  /**
   * Get error analysis for a test
   */
  static async getErrorAnalysis(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/error-analysis?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch error analysis');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching error analysis:', error);
      throw new Error('Failed to fetch error analysis');
    }
  }

  /**
   * Get mistake patterns
   */
  static async getMistakePatterns(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/mistake-patterns?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch mistake patterns');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching mistake patterns:', error);
      throw new Error('Failed to fetch mistake patterns');
    }
  }

  // ==========================================
  // 🧭 BEHAVIORAL ANALYSIS
  // ==========================================

  /**
   * Get navigation patterns
   */
  static async getNavigationPatterns(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/navigation-patterns?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch navigation patterns');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching navigation patterns:', error);
      throw new Error('Failed to fetch navigation patterns');
    }
  }

  /**
   * Get interaction metrics
   */
  static async getInteractionMetrics(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/interaction-metrics?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch interaction metrics');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching interaction metrics:', error);
      throw new Error('Failed to fetch interaction metrics');
    }
  }

  /**
   * Get behavioral insights
   */
  static async getBehavioralInsights(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/behavioral-insights?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch behavioral insights');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching behavioral insights:', error);
      throw new Error('Failed to fetch behavioral insights');
    }
  }

  // ==========================================
  // 📋 COMPARATIVE ANALYSIS
  // ==========================================

  /**
   * Get comparative analysis with other users
   */
  static async getComparativeAnalysis(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/comparative?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch comparative analysis');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching comparative analysis:', error);
      throw new Error('Failed to fetch comparative analysis');
    }
  }

  /**
   * Get percentile ranking
   */
  static async getPercentileRanking(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/percentile?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch percentile ranking');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching percentile ranking:', error);
      throw new Error('Failed to fetch percentile ranking');
    }
  }

  // ==========================================
  // 🎯 RECOMMENDATIONS
  // ==========================================

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/recommendations?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch recommendations');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new Error('Failed to fetch recommendations');
    }
  }

  /**
   * Get study plan suggestions
   */
  static async getStudyPlanSuggestions(testId: string) {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/analytics/study-plan?testId=${testId}`, 
        { method: 'GET' }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch study plan suggestions');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching study plan suggestions:', error);
      throw new Error('Failed to fetch study plan suggestions');
    }
  }

  // ==========================================
  // 🔧 UTILITY METHODS
  // ==========================================

  /**
   * Transform raw analysis data to AnalysisData format
   */
  static transformAnalysisData(rawData: TestAnalysisResponse): AnalysisData {
    // Validate input data
    if (!rawData || !rawData.answers || !rawData.metadata || !rawData.performance) {
      throw new Error('Invalid analysis data structure');
    }

    const questionAnalysis: QuestionAnalysis[] = rawData.answers.map((answer, index) => {
      const questionMetadata = rawData.metadata.questions.find(q => q.id === answer.questionId);
      return {
        questionId: answer.questionId,
        isCorrect: answer.isCorrect,
        userAnswer: answer.selectedOption,
        correctAnswer: answer.correctAnswer[0] || 0,
        timeTaken: answer.timeSpent,
        difficulty: questionMetadata?.difficulty || 'medium',
        subject: questionMetadata?.subject || 'unknown',
        chapter: questionMetadata?.topic || 'unknown',
        topic: questionMetadata?.topic || 'unknown'
      };
    });

    const subjectPerformance: SubjectPerformance[] = Object.entries(rawData.subjectWise).map(([subject, data]) => ({
      subject,
      totalQuestions: data.total,
      correctAnswers: data.correct,
      incorrectAnswers: data.attempted - data.correct,
      unattempted: data.total - data.attempted,
      accuracy: data.attempted > 0 ? (data.correct / data.attempted) * 100 : 0,
      averageTime: data.timeSpent / data.attempted || 0,
      strongTopics: [],
      weakTopics: []
    }));

    const timeAnalysis: TimeAnalysis = {
      totalTime: rawData.timeAnalytics.totalTimeSpent,
      averageTimePerQuestion: rawData.timeAnalytics.averageTimePerQuestion,
      timeDistribution: {
        fast: rawData.timeAnalytics.questionTimeDistribution.lessThan30Sec.length,
        moderate: rawData.timeAnalytics.questionTimeDistribution.between30To60Sec.length + 
                 rawData.timeAnalytics.questionTimeDistribution.between1To2Min.length,
        slow: rawData.timeAnalytics.questionTimeDistribution.moreThan2Min.length
      },
      timeEfficiency: this.calculateTimeEfficiency({
        totalTime: rawData.timeAnalytics.totalTimeSpent,
        averageTimePerQuestion: rawData.timeAnalytics.averageTimePerQuestion,
        timeDistribution: {
          fast: rawData.timeAnalytics.questionTimeDistribution.lessThan30Sec.length,
          moderate: rawData.timeAnalytics.questionTimeDistribution.between30To60Sec.length + 
                   rawData.timeAnalytics.questionTimeDistribution.between1To2Min.length,
          slow: rawData.timeAnalytics.questionTimeDistribution.moreThan2Min.length
        },
        timeEfficiency: 0
      })
    };

    const difficultyAnalysis: DifficultyAnalysis = {
      easy: { attempted: 0, correct: 0, accuracy: 0 },
      medium: { attempted: 0, correct: 0, accuracy: 0 },
      hard: { attempted: 0, correct: 0, accuracy: 0 }
    };

    // Calculate difficulty analysis
    questionAnalysis.forEach(question => {
      const difficulty = question.difficulty.toLowerCase();
      if (difficulty === 'easy' || difficulty === 'e') {
        difficultyAnalysis.easy.attempted++;
        if (question.isCorrect) difficultyAnalysis.easy.correct++;
      } else if (difficulty === 'medium' || difficulty === 'm') {
        difficultyAnalysis.medium.attempted++;
        if (question.isCorrect) difficultyAnalysis.medium.correct++;
      } else if (difficulty === 'hard' || difficulty === 'h') {
        difficultyAnalysis.hard.attempted++;
        if (question.isCorrect) difficultyAnalysis.hard.correct++;
      }
    });

    // Calculate accuracy for each difficulty level
    difficultyAnalysis.easy.accuracy = difficultyAnalysis.easy.attempted > 0 ? 
      (difficultyAnalysis.easy.correct / difficultyAnalysis.easy.attempted) * 100 : 0;
    difficultyAnalysis.medium.accuracy = difficultyAnalysis.medium.attempted > 0 ? 
      (difficultyAnalysis.medium.correct / difficultyAnalysis.medium.attempted) * 100 : 0;
    difficultyAnalysis.hard.accuracy = difficultyAnalysis.hard.attempted > 0 ? 
      (difficultyAnalysis.hard.correct / difficultyAnalysis.hard.attempted) * 100 : 0;

    return {
      testId: rawData.testInfo.testId,
      userId: '', // Will be filled by the calling code
      overallScore: rawData.performance.score,
      totalQuestions: rawData.performance.totalQuestions,
      correctAnswers: rawData.performance.totalCorrectAnswers,
      incorrectAnswers: rawData.performance.totalWrongAnswers,
      unattempted: rawData.performance.totalUnattempted,
      accuracy: rawData.performance.percentage,
      timeTaken: rawData.performance.totalTimeTaken,
      questionAnalysis,
      subjectPerformance,
      timeAnalysis,
      difficultyAnalysis,
      recommendations: this.generateRecommendations({
        testId: rawData.testInfo.testId,
        userId: '',
        overallScore: rawData.performance.score,
        totalQuestions: rawData.performance.totalQuestions,
        correctAnswers: rawData.performance.totalCorrectAnswers,
        incorrectAnswers: rawData.performance.totalWrongAnswers,
        unattempted: rawData.performance.totalUnattempted,
        accuracy: rawData.performance.percentage,
        timeTaken: rawData.performance.totalTimeTaken,
        questionAnalysis,
        subjectPerformance,
        timeAnalysis,
        difficultyAnalysis,
        recommendations: { strengths: [], improvements: [], studyPlan: [] },
        generatedAt: new Date().toISOString(),
        version: '1.0.0'
      }),
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Calculate time efficiency score
   */
  static calculateTimeEfficiency(timeAnalysis: TimeAnalysis): number {
    const { totalTime, averageTimePerQuestion, timeDistribution } = timeAnalysis;
    const totalQuestions = timeDistribution.fast + timeDistribution.moderate + timeDistribution.slow;
    
    if (totalQuestions === 0) return 0;
    
    // Weight factors for different time categories
    const fastWeight = 1.0;
    const moderateWeight = 0.7;
    const slowWeight = 0.3;
    
    const efficiencyScore = (
      (timeDistribution.fast * fastWeight) +
      (timeDistribution.moderate * moderateWeight) +
      (timeDistribution.slow * slowWeight)
    ) / totalQuestions;
    
    return Math.round(efficiencyScore * 100);
  }

  /**
   * Generate recommendations based on analysis data
   */
  static generateRecommendations(analysisData: AnalysisData): {
    strengths: string[];
    improvements: string[];
    studyPlan: string[];
  } {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const studyPlan: string[] = [];

    // Analyze strengths
    const highAccuracySubjects = analysisData.subjectPerformance
      .filter(subject => subject.accuracy >= 80)
      .map(subject => subject.subject);

    if (highAccuracySubjects.length > 0) {
      strengths.push(`Strong performance in ${highAccuracySubjects.join(', ')}`);
    }

    if (analysisData.timeAnalysis.timeEfficiency >= 70) {
      strengths.push('Good time management skills');
    }

    // Analyze areas for improvement
    const lowAccuracySubjects = analysisData.subjectPerformance
      .filter(subject => subject.accuracy < 60)
      .map(subject => subject.subject);

    if (lowAccuracySubjects.length > 0) {
      improvements.push(`Focus on improving ${lowAccuracySubjects.join(', ')}`);
    }

    if (analysisData.timeAnalysis.timeEfficiency < 50) {
      improvements.push('Work on time management and speed');
    }

    // Generate study plan
    if (lowAccuracySubjects.length > 0) {
      studyPlan.push(`Practice more questions in ${lowAccuracySubjects.join(', ')}`);
    }

    studyPlan.push('Review incorrect answers and understand the concepts');
    studyPlan.push('Take timed practice tests to improve speed');

    return { strengths, improvements, studyPlan };
  }

  /**
   * Validate analysis data structure
   */
  static validateAnalysisData(data: any): boolean {
    if (!data) return false;
    
    const requiredFields = ['testId', 'performance', 'questionAnalysis', 'subjectPerformance'];
    return requiredFields.every(field => data.hasOwnProperty(field));
  }
}

// ==========================================
// 📤 EXPORTS
// ==========================================

export default AnalysisService;
