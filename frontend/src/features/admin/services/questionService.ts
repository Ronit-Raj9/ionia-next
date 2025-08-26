import { fetchWithAuth } from '@/features/auth/api/authApi';
import type { 
  Question, 
  PaginatedQuestions, 
  CreateQuestionData, 
  UpdateQuestionData 
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface APIResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

interface QuestionQueryParams {
  subject?: string[];
  examType?: string[];
  difficulty?: string[];
  chapter?: string[];
  language?: string[];
  languageLevel?: string[];
  questionType?: string[];
  isVerified?: boolean | null;
  isActive?: boolean | null;
  year?: string[];
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  section?: string[];
  questionCategory?: string[];
  questionSource?: string[];
  solutionMode?: string;
  dateRange?: string;
  hasOptions?: boolean | null;
  class?: string[];
  searchQuery?: string;
}

/**
 * Service class for handling question-related operations
 */
export class QuestionService {
  /**
   * Fetch paginated questions with filters
   */
  static async getQuestions(params: QuestionQueryParams = {}): Promise<PaginatedQuestions> {
    const queryParams = new URLSearchParams();

    // Add pagination
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    // Add sorting
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // Add search query
    if (params.searchQuery) queryParams.append('search', params.searchQuery);

    // Add array filters
    const addArrayParams = (key: string, values: string[] | undefined) => {
      if (values && values.length > 0) {
        values.forEach(value => queryParams.append(`${key}[]`, value.toLowerCase()));
      }
    };

    addArrayParams('subject', params.subject);
    addArrayParams('examType', params.examType);
    addArrayParams('difficulty', params.difficulty);
    addArrayParams('year', params.year);
    addArrayParams('section', params.section);
    addArrayParams('languageLevel', params.languageLevel);
    addArrayParams('questionType', params.questionType);
    addArrayParams('class', params.class);
    addArrayParams('questionCategory', params.questionCategory);
    addArrayParams('questionSource', params.questionSource);
    addArrayParams('tags', params.tags);
    addArrayParams('chapter', params.chapter);
    addArrayParams('language', params.language);

    // Add boolean and single value filters
    if (params.isVerified !== null && params.isVerified !== undefined) {
      queryParams.append('isVerified', params.isVerified.toString());
    }
    if (params.isActive !== null && params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }
    if (params.hasOptions !== null && params.hasOptions !== undefined) {
      queryParams.append('hasOptions', params.hasOptions.toString());
    }
    if (params.solutionMode) {
      queryParams.append('solutionMode', params.solutionMode);
    }
    if (params.dateRange && params.dateRange !== 'all') {
      queryParams.append('dateRange', params.dateRange);
    }

    try {
      const response = await fetchWithAuth<APIResponse<PaginatedQuestions>>(
        `${API_BASE}/v1/questions?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch questions:', error);
      throw new Error(error.message || 'Failed to fetch questions');
    }
  }

  /**
   * Get a single question by ID
   */
  static async getQuestionById(questionId: string): Promise<Question> {
    try {
      const response = await fetchWithAuth<APIResponse<Question>>(
        `${API_BASE}/v1/questions/${questionId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch question:', error);
      throw new Error(error.message || 'Failed to fetch question');
    }
  }

  /**
   * Create a new question
   */
  static async createQuestion(questionData: CreateQuestionData): Promise<Question> {
    const formData = new FormData();
    
    // Add text fields
    Object.entries(questionData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && !key.includes('Image')) {
        if (typeof value === 'object' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add image files if present
    if (questionData.questionImage) formData.append('questionImage', questionData.questionImage);
    if (questionData.solutionImage) formData.append('solutionImage', questionData.solutionImage);
    
    // Handle option images
    if (questionData.optionImages) {
      questionData.optionImages.forEach((file, index) => {
        if (file) formData.append(`option${index}Image`, file);
      });
    }

    // Handle hint images
    if (questionData.hint0Image) formData.append('hint0Image', questionData.hint0Image);
    if (questionData.hint1Image) formData.append('hint1Image', questionData.hint1Image);
    if (questionData.hint2Image) formData.append('hint2Image', questionData.hint2Image);

    try {
      const response = await fetchWithAuth<APIResponse<Question>>(
        `${API_BASE}/v1/questions/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to create question:', error);
      throw new Error(error.message || 'Failed to create question');
    }
  }

  /**
   * Update an existing question
   */
  static async updateQuestion(questionId: string, questionData: UpdateQuestionData): Promise<Question> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(questionData));

    // Add image files if present
    if (questionData.questionImage) formData.append('questionImage', questionData.questionImage);
    if (questionData.solutionImage) formData.append('solutionImage', questionData.solutionImage);
    if (questionData.optionImages) {
      questionData.optionImages.forEach((file, index) => {
        if (file) formData.append('optionImages', file);
      });
      if (questionData.optionImageIndexes) {
        questionData.optionImageIndexes.forEach(index => {
          formData.append('optionImageIndexes', index.toString());
        });
      }
    }

    try {
      const response = await fetchWithAuth<APIResponse<Question>>(
        `${API_BASE}/v1/questions/${questionId}`,
        {
          method: 'PATCH',
          body: formData,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to update question:', error);
      throw new Error(error.message || 'Failed to update question');
    }
  }

  /**
   * Delete a question permanently
   */
  static async deleteQuestion(questionId: string): Promise<void> {
    try {
      await fetchWithAuth<APIResponse<null>>(
        `${API_BASE}/v1/questions/${questionId}/permanent-delete`,
        {
          method: 'DELETE',
          body: JSON.stringify({ confirmDelete: true }),
        }
      );
    } catch (error: any) {
      console.error('Failed to delete question:', error);
      throw new Error(error.message || 'Failed to delete question');
    }
  }

  /**
   * Toggle question active status
   */
  static async toggleQuestionStatus(questionId: string, isActive: boolean): Promise<Question> {
    try {
      const response = await fetchWithAuth<APIResponse<Question>>(
        `${API_BASE}/v1/questions/${questionId}/toggle-status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isActive }),
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to toggle question status:', error);
      throw new Error(error.message || 'Failed to toggle question status');
    }
  }

  /**
   * Verify a question (admin only)
   */
  static async verifyQuestion(questionId: string): Promise<Question> {
    try {
      const response = await fetchWithAuth<APIResponse<Question>>(
        `${API_BASE}/v1/questions/verify/${questionId}`,
        {
          method: 'PATCH',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to verify question:', error);
      throw new Error(error.message || 'Failed to verify question');
    }
  }

  /**
   * Duplicate a question
   */
  static async duplicateQuestion(questionId: string): Promise<Question> {
    try {
      const response = await fetchWithAuth<APIResponse<Question>>(
        `${API_BASE}/v1/questions/${questionId}/duplicate`,
        {
          method: 'POST',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to duplicate question:', error);
      throw new Error(error.message || 'Failed to duplicate question');
    }
  }

  /**
   * Get question statistics
   */
  static async getQuestionStatistics(questionId: string): Promise<any> {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/v1/questions/${questionId}/statistics`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get question statistics:', error);
      // Return mock data for development/testing
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
        averageTime: 0,
        averageScore: 0,
        difficultyRating: 0,
        successRate: 0,
        timeDistribution: {
          fast: 0,
          medium: 0,
          slow: 0
        },
        scoreDistribution: {
          excellent: 0,
          good: 0,
          average: 0,
          poor: 0
        }
      };
    }
  }

  /**
   * Bulk upload questions
   */
  static async bulkUploadQuestions(questions: CreateQuestionData[]): Promise<Question[]> {
    try {
      const response = await fetchWithAuth<APIResponse<Question[]>>(
        `${API_BASE}/v1/questions/bulk-upload`,
        {
          method: 'POST',
          body: JSON.stringify({ questions }),
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to bulk upload questions:', error);
      throw new Error(error.message || 'Failed to bulk upload questions');
    }
  }

  /**
   * Bulk delete questions
   */
  static async bulkDeleteQuestions(questionIds: string[]): Promise<void> {
    try {
      await fetchWithAuth<APIResponse<null>>(
        `${API_BASE}/v1/questions/bulk-delete`,
        {
          method: 'POST',
          body: JSON.stringify({ ids: questionIds }),
        }
      );
    } catch (error: any) {
      console.error('Failed to bulk delete questions:', error);
      throw new Error(error.message || 'Failed to bulk delete questions');
    }
  }

  /**
   * Get question revision history
   */
  static async getQuestionRevisionHistory(questionId: string): Promise<any> {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/v1/questions/${questionId}/change-history`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get question revision history:', error);
      // Return mock data for development/testing
      return [
        {
          version: 1,
          modifiedBy: 'admin@example.com',
          changes: 'Content updated',
          timestamp: new Date('2025-05-21T21:45:00Z'),
          description: 'Content updated'
        },
        {
          version: 2,
          modifiedBy: 'admin@example.com',
          changes: 'Question deactivated',
          timestamp: new Date('2025-08-06T23:19:00Z'),
          description: 'Question deactivated'
        },
        {
          version: 3,
          modifiedBy: 'admin@example.com',
          changes: 'Question activated',
          timestamp: new Date('2025-08-06T23:19:00Z'),
          description: 'Question activated'
        },
        {
          version: 4,
          modifiedBy: 'admin@example.com',
          changes: 'Question deactivated',
          timestamp: new Date('2025-08-06T23:19:00Z'),
          description: 'Question deactivated'
        },
        {
          version: 5,
          modifiedBy: 'admin@example.com',
          changes: 'Question activated',
          timestamp: new Date('2025-08-06T23:19:00Z'),
          description: 'Question activated'
        }
      ];
    }
  }

  /**
   * Get detailed change history
   */
  static async getDetailedChangeHistory(questionId: string): Promise<any> {
    try {
      const response = await fetchWithAuth<APIResponse<any>>(
        `${API_BASE}/v1/questions/${questionId}/detailed-change-history`
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to get detailed change history:', error);
      throw new Error(error.message || 'Failed to get detailed change history');
    }
  }

  /**
   * Revert question to a specific version
   */
  static async revertToVersion(questionId: string, version: number): Promise<Question> {
    try {
      const response = await fetchWithAuth<APIResponse<Question>>(
        `${API_BASE}/v1/questions/${questionId}/revert`,
        {
          method: 'POST',
          body: JSON.stringify({ version }),
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to revert question:', error);
      throw new Error(error.message || 'Failed to revert question');
    }
  }
}
