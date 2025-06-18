// lib/api/tests.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Generic API response interface
export interface APIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Example type for a Test (refine based on your API schema)
export type Test = {
  _id: string;
  // Add other test properties here
};

// Get a single test by ID
export const getTestById = async (testId: string): Promise<APIResponse<Test>> => {
  try {
    const response = await axios.get<APIResponse<Test>>(`${API_URL}/tests/${testId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching test:', error);
    throw new Error('Failed to fetch test');
  }
};

// Get tests by subject
export const getTestsBySubject = async (subjectId: string): Promise<APIResponse<Test[]>> => {
  try {
    const response = await axios.get<APIResponse<Test[]>>(`${API_URL}/tests/${subjectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tests:', error);
    throw new Error('Failed to fetch tests');
  }
};

// Submit test answers
export const submitTestAnswers = async (
  testId: string,
  answers: unknown
): Promise<APIResponse<Test>> => {
  try {
    const response = await axios.post<APIResponse<Test>>(`${API_URL}/tests/${testId}/submit`, answers);
    return response.data;
  } catch (error) {
    console.error('Error submitting test:', error);
    throw new Error('Failed to submit test');
  }
};
