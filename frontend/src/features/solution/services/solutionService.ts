import { SolutionApi } from '../api/solutionApi';
import { 
  SolutionData, 
  SolutionQuestion, 
  SolutionTestInfo, 
  SolutionPerformance,
  SolutionApiResponse,
  SolutionReport,
  SimilarQuestion
} from '../types';
import { calculatePerformanceMetrics } from '../utils/util';

/**
 * Solution Service
 * Handles business logic for solution viewing and management
 */
export class SolutionService {
  /**
   * Fetch and process solution data for a test attempt
   * @param attemptId - The attempt ID to fetch solutions for
   * @returns Promise<SolutionData>
   */
  static async fetchSolutionData(attemptId: string): Promise<SolutionData> {
    try {
      console.log('SolutionService.fetchSolutionData called with attemptId:', attemptId);
      
      // Fetch raw solution data from API
      const apiResponse: SolutionApiResponse = await SolutionApi.getSolutions(attemptId);
      console.log('SolutionService received apiResponse:', apiResponse);
      
      // Process the API response into our internal format
      const processedData = this.processSolutionData(apiResponse);
      console.log('SolutionService processed data:', processedData);
      
      return processedData;
    } catch (error) {
      console.error('Error fetching solution data:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to fetch solution data'
      );
    }
  }

  /**
   * Process raw API response into internal SolutionData format
   * @param apiResponse - Raw API response
   * @returns SolutionData
   */
  private static processSolutionData(apiResponse: SolutionApiResponse): SolutionData {
    console.log("Processing solution data - Full API response:", apiResponse);
    
    if (!apiResponse || !apiResponse.success) {
      console.error("Invalid API response:", apiResponse);
      throw new Error(apiResponse?.message || 'Invalid API response');
    }
    
    if (!apiResponse.data) {
      console.error("No data in API response:", apiResponse);
      throw new Error('No solution data received from API');
    }

    const { attemptId, testId, testTitle, solutions = [] } = apiResponse.data || {};

    console.log("Raw solution data received:", apiResponse.data);
    console.log("Processing solution data:", {
      attemptId,
      testId,
      testTitle,
      solutionCount: solutions.length
    });

    // Process solutions to match our expected format
    const questions: SolutionQuestion[] = solutions.map((solution, index) => {
      // Log each solution item to inspect its structure
      console.log(`Processing solution item ${index}:`, {
        questionId: solution.questionId,
        userSelected: solution.userSelected,
        isCorrect: solution.isCorrect,
        content: solution.content
      });

      // Handle question content format - improved logic from old version
      let questionContent = 'Question not available';
      
      if (solution.content) {
        if (typeof solution.content === 'string') {
          questionContent = solution.content;
        } else if (typeof solution.content === 'object' && (solution.content as any).text) {
          questionContent = (solution.content as any).text;
        }
      } else {
        console.warn(`No content found for solution ${index}:`, solution);
      }

      console.log(`Question content for ${index}:`, questionContent.substring(0, 100) + (questionContent.length > 100 ? '...' : ''));

      // Process options to ensure they're in the right format - improved from old version
      let processedOptions: { text: string; image?: string }[] = [];
      if (solution.options) {
        // If options is an array of strings, convert to objects with text property
        if (Array.isArray(solution.options)) {
          processedOptions = solution.options.map((opt: string | { text: string; image?: string }) => 
            typeof opt === 'string' ? { text: opt } : opt
          );
        }
      }

      return {
        id: solution.questionId,
        question: questionContent,
        options: processedOptions.length > 0 ? processedOptions : solution.options || [],
        subject: solution.subject || 'General',
        topic: solution.topic || '',
        difficulty: solution.difficulty || 'Medium',
        userAnswer: solution.userSelected,
        correctAnswer: solution.correctOptions,
        isCorrect: solution.isCorrect,
        timeSpent: solution.timeSpent || 0,
        explanation: solution.explanation || 'No explanation provided.',
        averageTime: 60, // Default average time (can be updated with actual data)
      };
    });

    // Log all processed questions to verify - from old version
    console.log("Processed questions:", questions.map((q: any) => ({
      id: q.id,
      questionPreview: q.question.substring(0, 50) + (q.question.length > 50 ? '...' : ''),
      optionsCount: q.options.length,
      userAnswer: q.userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: q.isCorrect
    })));

    // Calculate performance metrics using utility function
    const performanceMetrics = calculatePerformanceMetrics(questions);
    
    console.log('Solution performance calculation:', performanceMetrics);

    // Build test info
    const testInfo: SolutionTestInfo = {
      testId,
      attemptId,
      testTitle: testTitle || 'Test Solutions',
      markingScheme: {
        correct: 1,
        incorrect: 0,
        unattempted: 0
      }
    };

    // Build performance data
    const performance: SolutionPerformance = {
      ...performanceMetrics,
      accuracy: performanceMetrics.totalQuestions > 0 
        ? Math.round((performanceMetrics.totalCorrect / performanceMetrics.totalQuestions) * 100)
        : 0,
      completion: performanceMetrics.totalQuestions > 0
        ? Math.round(((performanceMetrics.totalCorrect + performanceMetrics.totalIncorrect) / performanceMetrics.totalQuestions) * 100)
        : 0
    };

    return {
      testInfo,
      questions,
      performance
    };
  }

  /**
   * Filter questions based on the selected filter
   * @param questions - Array of questions to filter
   * @param filter - Filter type
   * @param bookmarkedQuestions - Array of bookmarked question IDs
   * @returns Filtered questions array
   */
  static filterQuestions(
    questions: SolutionQuestion[],
    filter: 'all' | 'correct' | 'incorrect' | 'skipped' | 'bookmarked',
    bookmarkedQuestions: string[] = []
  ): SolutionQuestion[] {
    switch (filter) {
      case 'correct':
        return questions.filter(q => q.isCorrect);
      case 'incorrect':
        return questions.filter(q => !q.isCorrect && q.userAnswer !== undefined);
      case 'skipped':
        return questions.filter(q => q.userAnswer === undefined);
      case 'bookmarked':
        return questions.filter(q => bookmarkedQuestions.includes(q.id));
      default:
        return questions;
    }
  }

  /**
   * Get navigation data for questions
   * @param questions - Array of questions
   * @param currentIndex - Current question index
   * @returns Navigation data
   */
  static getNavigationData(questions: SolutionQuestion[], currentIndex: number) {
    const total = questions.length;
    const current = currentIndex + 1;
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < total - 1;

    return {
      current,
      total,
      hasPrevious,
      hasNext,
      progress: (current / total) * 100
    };
  }

  /**
   * Submit a question report
   * @param report - Report data
   * @returns Promise<boolean>
   */
  static async submitReport(report: SolutionReport): Promise<boolean> {
    try {
      const success = await SolutionApi.submitReport({
        questionId: report.questionId,
        issueType: report.issueType,
        description: report.description
      });

      if (success) {
        console.log('Report submitted successfully:', report);
      }

      return success;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  /**
   * Get similar questions for a given question
   * @param questionId - Question ID
   * @returns Promise<SimilarQuestion[]>
   */
  static async getSimilarQuestions(questionId: string): Promise<SimilarQuestion[]> {
    try {
      return await SolutionApi.getSimilarQuestions(questionId);
    } catch (error) {
      console.error('Error getting similar questions:', error);
      throw error;
    }
  }

  /**
   * Save user note for a question
   * @param attemptId - Attempt ID
   * @param questionId - Question ID
   * @param note - Note content
   * @returns Promise<boolean>
   */
  static async saveNote(attemptId: string, questionId: string, note: string): Promise<boolean> {
    try {
      return await SolutionApi.saveNote(attemptId, questionId, note);
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  /**
   * Get user notes for an attempt
   * @param attemptId - Attempt ID
   * @returns Promise<Record<string, string>>
   */
  static async getNotes(attemptId: string): Promise<Record<string, string>> {
    try {
      return await SolutionApi.getNotes(attemptId);
    } catch (error) {
      console.error('Error getting notes:', error);
      return {};
    }
  }

  /**
   * Save bookmarked questions
   * @param attemptId - Attempt ID
   * @param bookmarkedQuestions - Array of bookmarked question IDs
   * @returns Promise<boolean>
   */
  static async saveBookmarks(attemptId: string, bookmarkedQuestions: string[]): Promise<boolean> {
    try {
      return await SolutionApi.saveBookmarks(attemptId, bookmarkedQuestions);
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      throw error;
    }
  }

  /**
   * Get bookmarked questions
   * @param attemptId - Attempt ID
   * @returns Promise<string[]>
   */
  static async getBookmarks(attemptId: string): Promise<string[]> {
    try {
      return await SolutionApi.getBookmarks(attemptId);
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  /**
   * Save user preferences
   * @param preferences - User preferences
   * @returns Promise<boolean>
   */
  static async savePreferences(preferences: {
    darkMode?: boolean;
    readingMode?: boolean;
  }): Promise<boolean> {
    try {
      return await SolutionApi.savePreferences(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   * @returns Promise<User preferences>
   */
  static async getPreferences(): Promise<{
    darkMode: boolean;
    readingMode: boolean;
  }> {
    try {
      return await SolutionApi.getPreferences();
    } catch (error) {
      console.error('Error getting preferences:', error);
      return {
        darkMode: false,
        readingMode: false
      };
    }
  }

  /**
   * Generate solution summary for export
   * @param solutionData - Solution data
   * @param bookmarkedQuestions - Bookmarked question IDs
   * @param notes - User notes
   * @returns Summary object
   */
  static generateSolutionSummary(
    solutionData: SolutionData,
    bookmarkedQuestions: string[] = [],
    notes: Record<string, string> = {}
  ) {
    const { testInfo, questions, performance } = solutionData;

    return {
      testInfo: {
        title: testInfo.testTitle,
        testId: testInfo.testId,
        attemptId: testInfo.attemptId,
        completedAt: new Date().toISOString()
      },
      performance: {
        ...performance,
        bookmarkedCount: bookmarkedQuestions.length,
        notesCount: Object.keys(notes).length
      },
      questionSummary: questions.map(q => ({
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        isCorrect: q.isCorrect,
        timeSpent: q.timeSpent,
        isBookmarked: bookmarkedQuestions.includes(q.id),
        hasNote: !!notes[q.id]
      })),
      metadata: {
        totalQuestions: questions.length,
        correctAnswers: performance.totalCorrect,
        incorrectAnswers: performance.totalIncorrect,
        skippedQuestions: performance.totalSkipped,
        accuracy: performance.accuracy,
        completion: performance.completion
      }
    };
  }
}
