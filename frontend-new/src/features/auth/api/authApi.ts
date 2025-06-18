import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://3.7.73.172/api/v1";

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Always include credentials
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Configure axios defaults for CORS
axios.defaults.withCredentials = true;

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  // Add authentication token if available
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Define Auth Response type
export interface AuthResponse {
  user: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
    role: 'user' | 'admin' | 'superadmin';
    avatar?: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken?: string;
}

// User profile type
export interface User {
  _id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  accessToken: string;
  analytics?: {
    totalTests: number;
    testsThisWeek: number;
    averageScore: number;
    accuracy: number;
  };
}

// Check if cookies are enabled/accepted
const checkCookieConsent = (): boolean => {
  try {
    // Check if user has accepted cookies
    const hasConsent = localStorage.getItem('cookieConsent') !== null;
    
    // Check for mobile-specific consent cookie
    const hasMobileConsent = document.cookie.includes('mobileConsent=');
    
    // Set test cookie
    document.cookie = "testCookie=1; path=/; SameSite=None; Secure";
    const cookiesEnabled = document.cookie.includes('testCookie=');
    
    return hasConsent && cookiesEnabled;
  } catch (error) {
    console.error("Error checking cookie consent:", error);
    return false;
  }
};

// For production, ensure we're using the correct API URL
const getBaseUrl = (): string => {
  if (typeof window === 'undefined') return API_URL;
  
  const envUrl = process.env.NEXT_PUBLIC_API_URL || API_URL;
  return envUrl;
};

// Login User
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(`/users/login`, { 
      email, 
      password 
    });
    
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Login failed");
    }
    throw error;
  }
};

// Register User
export const registerUser = async (userData: { 
  fullName: string; 
  email: string; 
  username: string; 
  password: string 
}): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(`/users/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Registration failed");
    }
    throw error;
  }
};

// Get User Profile
export const getUserProfile = async (userId: string): Promise<User> => {
  const token = localStorage.getItem('accessToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await api.get<User>(`/users/${userId}`, { headers });
  return response.data;
};
