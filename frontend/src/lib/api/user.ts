import axios from 'axios';


export const loginUser = async (email: string, password: string): Promise<unknown> => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error: unknown) {
    console.error('Error logging in:', error);
    throw new Error('Failed to login');
  }
};

export const registerUser = async (email: string, password: string, name: string): Promise<unknown> => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, { email, password, name });
    return response.data;
  } catch (error: unknown) {
    console.error('Error registering user:', error);
    throw new Error('Failed to register');
  }
};

export const getUserProfile = async (userId: string): Promise<unknown> => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/${userId}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch profile');
  }
};

export const updateUserProfile = async (
  userId: string,
  updatedData: Record<string, unknown>
): Promise<unknown> => {
  try {
    const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/user/${userId}`, updatedData);
    return response.data;
  } catch (error: unknown) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }
};
