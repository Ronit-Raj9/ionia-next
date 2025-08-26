import * as TestAPI from '../api/testApi';
import type { 
  Test, 
  PaginatedTests, 
  CreateTestData, 
  UpdateTestData 
} from '../types';

// ==========================================
// 📊 TEST SERVICE
// ==========================================

export class TestService {
  /**
   * Create a new test
   */
  static async createTest(data: CreateTestData): Promise<Test> {
    try {
      // Validate required fields
      if (!data.title || !data.testCategory || !data.questions || !data.duration || !data.subject || !data.examType || !data.class) {
        throw new Error('Missing required fields: title, testCategory, questions, duration, subject, examType, class');
      }

      // Validate questions array
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('Test must contain at least one question');
      }

      // Validate type-specific required fields
      if (data.testCategory === 'PYQ' && !data.year) {
        throw new Error('Year is required for PYQ tests');
      }
      if (data.testCategory === 'Platform' && !data.platformTestType) {
        throw new Error('Platform Test Type is required for Platform tests');
      }

      const test = await TestAPI.createTest(data);
      return test;
    } catch (error) {
      console.error('Error creating test:', error);
      throw error;
    }
  }

  /**
   * Get all tests with pagination and filters
   */
  static async getTests(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    testCategory?: 'PYQ' | 'Platform' | 'UserCustom';
    status?: 'draft' | 'published' | 'archived';
    subject?: string;
    examType?: string;
    class?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    platformTestType?: string;
    year?: number;
    isPremium?: boolean;
    createdBy?: string;
    tag?: string;
    fetchAll?: boolean;
  }): Promise<PaginatedTests> {
    try {
      const tests = await TestAPI.getTests(params);
      return tests;
    } catch (error) {
      console.error('Error fetching tests:', error);
      throw error;
    }
  }

  /**
   * Get all tests without pagination (admin only)
   */
  static async getAllTests(): Promise<PaginatedTests> {
    try {
      const tests = await TestAPI.getAllTests();
      return tests;
    } catch (error) {
      console.error('Error fetching all tests:', error);
      throw error;
    }
  }

  /**
   * Get a single test by ID
   */
  static async getTestById(id: string): Promise<Test> {
    try {
      if (!id) {
        throw new Error('Test ID is required');
      }

      console.log('TestService: Fetching test with ID:', id);
      const test = await TestAPI.getTestById(id);
      console.log('TestService: Test fetched successfully:', test);
      return test;
    } catch (error) {
      console.error('TestService: Error fetching test by ID:', error);
      throw error;
    }
  }

  /**
   * Update an existing test
   */
  static async updateTest(id: string, data: UpdateTestData): Promise<Test> {
    try {
      if (!id) {
        throw new Error('Test ID is required');
      }

      if (Object.keys(data).length === 0) {
        throw new Error('No update data provided');
      }

      // Validate status if provided
      if (data.status) {
        const validStatuses = ['draft', 'published', 'archived'];
        if (!validStatuses.includes(data.status)) {
          throw new Error(`Invalid status value: ${data.status}. Must be one of: ${validStatuses.join(', ')}`);
        }
      }

      const test = await TestAPI.updateTest(id, data);
      return test;
    } catch (error) {
      console.error('Error updating test:', error);
      throw error;
    }
  }

  /**
   * Delete a test
   */
  static async deleteTest(id: string): Promise<{ deletedId: string }> {
    try {
      if (!id) {
        throw new Error('Test ID is required');
      }

      const result = await TestAPI.deleteTest(id);
      return result;
    } catch (error) {
      console.error('Error deleting test:', error);
      throw error;
    }
  }

  /**
   * Get a test prepared for attempting (without answers)
   */
  static async getTestForAttempt(id: string): Promise<{
    _id: string;
    title: string;
    description: string;
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
    questions: Array<{
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
      userAnswer?: string;
      isMarked: boolean;
      timeTaken: number;
      isVisited: boolean;
    }>;
  }> {
    try {
      if (!id) {
        throw new Error('Test ID is required');
      }

      const test = await TestAPI.getTestForAttempt(id);
      return test;
    } catch (error) {
      console.error('Error fetching test for attempt:', error);
      throw error;
    }
  }

  /**
   * Get mock tests by exam type (public endpoint)
   */
  static async getMockTests(examType: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    subject?: string;
    class?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    isPremium?: boolean;
    tag?: string;
  }): Promise<PaginatedTests> {
    try {
      if (!examType) {
        throw new Error('Exam type is required');
      }

      const tests = await TestAPI.getMockTests(examType, params);
      return tests;
    } catch (error) {
      console.error('Error fetching mock tests:', error);
      throw error;
    }
  }

  /**
   * Get a specific mock test by ID (public endpoint)
   */
  static async getMockTestById(examType: string, id: string): Promise<Test> {
    try {
      if (!examType) {
        throw new Error('Exam type is required');
      }
      if (!id) {
        throw new Error('Test ID is required');
      }

      const test = await TestAPI.getMockTestById(examType, id);
      return test;
    } catch (error) {
      console.error('Error fetching mock test by ID:', error);
      throw error;
    }
  }

  /**
   * Get a mock test prepared for attempting (public endpoint)
   */
  static async getMockTestForAttempt(examType: string, id: string): Promise<{
    _id: string;
    title: string;
    description: string;
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
    questions: Array<{
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
      userAnswer?: string;
      isMarked: boolean;
      timeTaken: number;
      isVisited: boolean;
    }>;
  }> {
    try {
      if (!examType) {
        throw new Error('Exam type is required');
      }
      if (!id) {
        throw new Error('Test ID is required');
      }

      const test = await TestAPI.getMockTestForAttempt(examType, id);
      return test;
    } catch (error) {
      console.error('Error fetching mock test for attempt:', error);
      throw error;
    }
  }

  /**
   * Get a test with populated questions (for admin view)
   */
  static async getTestWithQuestions(id: string): Promise<Test> {
    try {
      if (!id) {
        throw new Error('Test ID is required');
      }

      console.log('TestService: Fetching test with populated questions for ID:', id);
      const test = await TestAPI.getTestWithQuestions(id);
      console.log('TestService: Test with questions fetched successfully:', test);
      return test;
    } catch (error) {
      console.error('TestService: Error fetching test with questions:', error);
      throw error;
    }
  }

  /**
   * Validate test data before creation/update
   */
  static validateTestData(data: CreateTestData | UpdateTestData): string[] {
    const errors: string[] = [];

    // Basic validation
    if (!data.title?.trim()) {
      errors.push('Title is required');
    }

    if (!data.testCategory) {
      errors.push('Test category is required');
    }

    if (!data.subject?.trim()) {
      errors.push('Subject is required');
    }

    if (!data.examType?.trim()) {
      errors.push('Exam type is required');
    }

    if (!data.class?.trim()) {
      errors.push('Class is required');
    }

    if (!data.duration || data.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    // Questions validation
    if (Array.isArray(data.questions) && data.questions.length === 0) {
      errors.push('Test must contain at least one question');
    }

    // Category-specific validation
    if (data.testCategory === 'PYQ') {
      if (!data.year) {
        errors.push('Year is required for PYQ tests');
      }
    }

    if (data.testCategory === 'Platform') {
      if (!data.platformTestType?.trim()) {
        errors.push('Platform test type is required for Platform tests');
      }
    }

    return errors;
  }

  /**
   * Format test data for API submission
   */
  static formatTestData(data: CreateTestData | UpdateTestData): CreateTestData | UpdateTestData {
    const formatted: any = { ...data };
    
    if (formatted.title) formatted.title = formatted.title.trim();
    if (formatted.description) formatted.description = formatted.description.trim();
    if (formatted.subject) formatted.subject = formatted.subject.trim();
    if (formatted.examType) formatted.examType = formatted.examType.trim();
    if (formatted.class) formatted.class = formatted.class.trim();
    if (formatted.instructions) formatted.instructions = formatted.instructions.trim();
    if (formatted.tags) formatted.tags = formatted.tags.filter((tag: string) => tag.trim().length > 0);
    
    return formatted;
  }
}
