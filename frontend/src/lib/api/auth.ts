import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

// Define Auth Response type
export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    token: string;
  };
}

// User profile type
export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
}

// Login User
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, { email, password });
  return response.data;
};

// Register User
export const registerUser = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, {
    email,
    password,
    name,
  });
  return response.data;
};

// Get User Profile
export const getUserProfile = async (userId: string): Promise<User> => {
  const response = await axios.get<User>(`${API_URL}/users/${userId}`);
  return response.data;
};
