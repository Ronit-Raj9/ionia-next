import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const getQuestionsByChapter = async (
  subjectId: string,
  chapterId: string
): Promise<unknown> => {
  try {
    const response = await axios.get(`${API_URL}/questions/${subjectId}/${chapterId}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching questions:', error);
    throw new Error('Failed to fetch questions');
  }
};

export const getQuestionById = async (questionId: string): Promise<unknown> => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching question:', error);
    throw new Error('Failed to fetch question');
  }
};

export const createCustomTest = async (
  testData: Record<string, unknown>
): Promise<unknown> => {
  try {
    const response = await axios.post(`${API_URL}/tests/custom`, testData);
    return response.data;
  } catch (error: unknown) {
    console.error('Error creating custom test:', error);
    throw new Error('Failed to create custom test');
  }
};
