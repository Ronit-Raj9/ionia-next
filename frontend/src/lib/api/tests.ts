// lib/api/tests.ts
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// Generic API response interface (adjust fields as needed)
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
    const response = await axios.get(`${API_URL}/tests/${testId}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching test:', error);
    throw new Error('Failed to fetch test');
  }
};

// Get tests by subject
export const getTestsBySubject = async (subjectId: string): Promise<APIResponse<Test[]>> => {
  try {
    const response = await axios.get(`${API_URL}/tests/${subjectId}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching tests:', error);
    throw new Error('Failed to fetch tests');
  }
};

// Submit test answers; change the answers type if you have a more specific interface
export const submitTestAnswers = async (
  testId: string,
  answers: unknown
): Promise<APIResponse<Test>> => {
  try {
    const response = await axios.post(`${API_URL}/tests/${testId}/submit`, answers);
    return response.data;
  } catch (error: unknown) {
    console.error('Error submitting test:', error);
    throw new Error('Failed to submit test');
  }
};
