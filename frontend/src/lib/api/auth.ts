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

// Create axios instance with credentials
const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: process.env.NODE_ENV === 'development',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add request interceptor to handle credentials conditionally
api.interceptors.request.use((config) => {
  // Only include credentials when domains match or in development
  if (typeof window !== 'undefined') {
    const baseUrl = config.baseURL || '';
    config.withCredentials = process.env.NODE_ENV === 'development' || 
      baseUrl.includes(window.location.hostname);
  }
  return config;
});

// Login User
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  // Check if cookies are enabled
  if (!checkCookieConsent()) {
    throw new Error("Please accept cookies to enable login functionality");
  }
  
  try {
  const response = await api.post<AuthResponse>(`/users/login`, { email, password });
  
  // Store token in localStorage as backup for mobile browsers that limit cookies
  if (response.data.accessToken) {
    localStorage.setItem('accessToken', response.data.accessToken);
  }
  
  return response.data;
  } catch (error) {
    console.error("Login error:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

// Register User
export const registerUser = async (userData: { fullName: string; email: string; username: string; password: string }): Promise<AuthResponse> => {
  // Check if cookies are enabled
  if (!checkCookieConsent()) {
    throw new Error("Please accept cookies to enable registration functionality");
  }
  
  const response = await api.post<AuthResponse>(`/users/register`, userData);
  
  // Store token in localStorage as backup for mobile browsers that limit cookies
  if (response.data.accessToken) {
    localStorage.setItem('accessToken', response.data.accessToken);
  }
  
  return response.data;
};

// Get User Profile
export const getUserProfile = async (userId: string): Promise<User> => {
  const token = localStorage.getItem('accessToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  const response = await api.get<User>(`/users/${userId}`, { headers });
  return response.data;
};
