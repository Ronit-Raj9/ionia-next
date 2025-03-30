import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Define Auth Response type
export interface AuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
    role: string;
  };
  accessToken: string;
  refreshToken?: string; // Make refreshToken optional
}

// User profile type
export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  accessToken: string;
}

// Login User
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, { email, password });
  return response.data;
};

// Register User
export const registerUser = async (userData: { fullName: string; email: string; username: string; password: string }): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, userData);
  return response.data;
};

// Get User Profile
export const getUserProfile = async (userId: string): Promise<User> => {
  const response = await axios.get<User>(`${API_URL}/users/${userId}`);
  return response.data;
};
