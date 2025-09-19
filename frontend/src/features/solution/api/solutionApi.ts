import { API } from '@/lib/api/api';
import { SolutionApiResponse } from '../types';

/**
 * Solution API service
 * Handles all API calls related to solution viewing and management
 */
export class SolutionApi {
  /**
   * Get solutions for a specific test attempt
   * @param attemptId - The attempt ID to get solutions for
   * @returns Promise<SolutionApiResponse>
   */
  static async getSolutions(attemptId: string): Promise<SolutionApiResponse> {
    try {
      console.log('SolutionApi.getSolutions called with attemptId:', attemptId);
      const response = await API.tests.getSolutions(attemptId);
      console.log('SolutionApi.getSolutions raw response:', response);
      
      // The TestService.getSolutions returns response.data directly
      // We need to wrap it in the expected SolutionApiResponse format
      if (response && response !== null && response !== undefined) {
        return {
          success: true,
          data: response,
          message: 'Solutions fetched successfully'
        };
      } else {
        console.error('SolutionApi.getSolutions - No valid response received:', response);
        return {
          success: false,
          data: {
            attemptId: '',
            testId: '',
            testTitle: '',
            solutions: []
          },
          message: 'No solution data found for this attempt'
        };
      }
    } catch (error) {
      console.error('Error fetching solutions:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to fetch solutions'
      );
    }
  }

  /**
   * Submit a report for a question
   * @param report - The report data
   * @returns Promise<boolean> - Success status
   */
  static async submitReport(report: {
    questionId: string;
    issueType: string;
    description: string;
  }): Promise<boolean> {
    try {
      // This would be implemented when the backend endpoint is available
      // For now, we'll simulate a successful submission
      console.log('Submitting report:', report);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw new Error('Failed to submit report');
    }
  }

  /**
   * Get similar questions for a given question
   * @param questionId - The question ID to find similar questions for
   * @returns Promise<Array> - Array of similar questions
   */
  static async getSimilarQuestions(questionId: string): Promise<Array<{
    id: string;
    question: string;
    topic: string;
    difficulty: string;
    accuracy?: number;
  }>> {
    try {
      // This would be implemented when the backend endpoint is available
      // For now, we'll return mock data
      console.log('Fetching similar questions for:', questionId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock similar questions
      return [
        {
          id: 'similar-1',
          question: 'Similar question 1 related to this topic',
          topic: 'Mathematics',
          difficulty: 'Medium',
          accuracy: 75
        },
        {
          id: 'similar-2',
          question: 'Similar question 2 related to this topic',
          topic: 'Mathematics',
          difficulty: 'Hard',
          accuracy: 60
        },
        {
          id: 'similar-3',
          question: 'Similar question 3 related to this topic',
          topic: 'Mathematics',
          difficulty: 'Easy',
          accuracy: 85
        }
      ];
    } catch (error) {
      console.error('Error fetching similar questions:', error);
      throw new Error('Failed to fetch similar questions');
    }
  }

  /**
   * Save user notes for a question
   * @param attemptId - The attempt ID
   * @param questionId - The question ID
   * @param note - The note content
   * @returns Promise<boolean> - Success status
   */
  static async saveNote(
    attemptId: string, 
    questionId: string, 
    note: string
  ): Promise<boolean> {
    try {
      // This would be implemented when the backend endpoint is available
      // For now, we'll just store in localStorage
      const notesKey = `notes-${attemptId}`;
      const existingNotes = JSON.parse(localStorage.getItem(notesKey) || '{}');
      existingNotes[questionId] = note;
      localStorage.setItem(notesKey, JSON.stringify(existingNotes));
      
      return true;
    } catch (error) {
      console.error('Error saving note:', error);
      throw new Error('Failed to save note');
    }
  }

  /**
   * Get user notes for an attempt
   * @param attemptId - The attempt ID
   * @returns Promise<Record<string, string>> - Notes by question ID
   */
  static async getNotes(attemptId: string): Promise<Record<string, string>> {
    try {
      const notesKey = `notes-${attemptId}`;
      return JSON.parse(localStorage.getItem(notesKey) || '{}');
    } catch (error) {
      console.error('Error getting notes:', error);
      return {};
    }
  }

  /**
   * Save bookmarked questions for an attempt
   * @param attemptId - The attempt ID
   * @param bookmarkedQuestions - Array of bookmarked question IDs
   * @returns Promise<boolean> - Success status
   */
  static async saveBookmarks(
    attemptId: string, 
    bookmarkedQuestions: string[]
  ): Promise<boolean> {
    try {
      const bookmarksKey = `bookmarks-${attemptId}`;
      localStorage.setItem(bookmarksKey, JSON.stringify(bookmarkedQuestions));
      return true;
    } catch (error) {
      console.error('Error saving bookmarks:', error);
      throw new Error('Failed to save bookmarks');
    }
  }

  /**
   * Get bookmarked questions for an attempt
   * @param attemptId - The attempt ID
   * @returns Promise<string[]> - Array of bookmarked question IDs
   */
  static async getBookmarks(attemptId: string): Promise<string[]> {
    try {
      const bookmarksKey = `bookmarks-${attemptId}`;
      return JSON.parse(localStorage.getItem(bookmarksKey) || '[]');
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  /**
   * Save user preferences
   * @param preferences - User preferences object
   * @returns Promise<boolean> - Success status
   */
  static async savePreferences(preferences: {
    darkMode?: boolean;
    readingMode?: boolean;
  }): Promise<boolean> {
    try {
      Object.entries(preferences).forEach(([key, value]) => {
        localStorage.setItem(key, String(value));
      });
      return true;
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw new Error('Failed to save preferences');
    }
  }

  /**
   * Get user preferences
   * @returns Promise<object> - User preferences
   */
  static async getPreferences(): Promise<{
    darkMode: boolean;
    readingMode: boolean;
  }> {
    try {
      return {
        darkMode: localStorage.getItem('darkMode') === 'true',
        readingMode: localStorage.getItem('readingMode') === 'true'
      };
    } catch (error) {
      console.error('Error getting preferences:', error);
      return {
        darkMode: false,
        readingMode: false
      };
    }
  }
}
