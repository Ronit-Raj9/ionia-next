import axios from 'axios';

export interface TestAnalytics {
  totalTests: number;
  totalQuestions: number;
  activeUsers: number;
  totalStudents: number;
  testsBySubject: Record<string, number>;
  completionRates: Record<string, number>;
  recentTests: Array<{
    id: string;
    title: string;
    questions: number;
    attempts: number;
    createdAt: string;
  }>;
  recentQuestions: Array<{
    id: string;
    title: string;
    subject: string;
    createdAt: string;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const fetchTestAnalytics = async (): Promise<TestAnalytics> => {
  try {
    console.log("Attempting to fetch analytics data");
    
    // For production, ensure we're using the correct API URL
    const baseUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_URL || window.location.origin)
      : API_URL;
    
    console.log("Using base URL:", baseUrl);
    
    // Try the main endpoint first
    try {
      // Use the correct API path that matches the backend route
      const response = await axios.get(`${baseUrl}/admin/analytics`, {
        // Include credentials
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add Authorization header if token exists
          ...(typeof window !== 'undefined' && localStorage.getItem('accessToken') 
              ? { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } 
              : {})
        }
      });
      
      console.log("Analytics data received from main endpoint:", response.data);
      return response.data;
    } catch (mainEndpointError) {
      console.error("Main endpoint failed, trying debug endpoint:", mainEndpointError);
      
      // If main endpoint fails, try the debug endpoint as a fallback
      const debugResponse = await axios.get(`${baseUrl}/api/debug-analytics`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('accessToken') 
              ? { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } 
              : {})
        }
      });
      
      console.log("Analytics data received from debug endpoint:", debugResponse.data);
      return debugResponse.data;
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    // Provide more detailed error information
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Request config:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        withCredentials: error.config?.withCredentials
      }, null, 2));
    }
    throw error;
  }
}; 