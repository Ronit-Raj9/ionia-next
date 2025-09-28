import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: 'admin' | 'student' | 'instructor' | 'guest_student' | 'guest_instructor';
  avatar?: string;
  studentId?: string;
  grade?: string;
  subjects?: string[];
  isEmailVerified: boolean;
  totalQuestionsAttempted: number;
  totalQuestionsCorrect: number;
  averageScore: number;
  learningStreak: number;
  accuracyPercentage: number;
  isGuest?: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { email: string; password: string; fullName: string; username: string; role?: string }) => Promise<void>;
  loginAsGuest: (role: 'guest_student' | 'guest_instructor') => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
  initializeAuth: () => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
}

type AuthStore = AuthState & AuthActions;

// Configure axios defaults
const API_BASE_URL = process.env.NEXT_PUBLIC_LMS_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {}, {
            withCredentials: true,
            headers: {
              'Cookie': `refreshToken=${refreshToken}`
            }
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshTokenValue: null,
      loading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await api.post('/auth/login', credentials);
          const { user, accessToken, refreshToken } = response.data.data;

          set((state) => {
            state.user = user;
            state.accessToken = accessToken;
            state.refreshTokenValue = refreshToken;
            state.loading = false;
          });

          // Store tokens in localStorage for persistence
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        } catch (error: any) {
          set((state) => {
            state.loading = false;
            state.error = error.response?.data?.message || 'Login failed';
          });
          throw error;
        }
      },

      register: async (userData) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          const response = await api.post('/auth/register', userData);
          const { user, accessToken, refreshToken } = response.data.data;

          set((state) => {
            state.user = user;
            state.accessToken = accessToken;
            state.refreshTokenValue = refreshToken;
            state.loading = false;
          });

          // Store tokens in localStorage for persistence
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        } catch (error: any) {
          set((state) => {
            state.loading = false;
            state.error = error.response?.data?.message || 'Registration failed';
          });
          throw error;
        }
      },

      loginAsGuest: (role) => {
        const guestUser: User = {
          id: `guest_${Date.now()}`,
          email: `${role}@guest.local`,
          fullName: role === 'guest_student' ? 'Guest Student' : 'Guest Instructor',
          username: role === 'guest_student' ? 'guest_student' : 'guest_instructor',
          role: role,
          avatar: undefined,
          studentId: role === 'guest_student' ? `GUEST${Date.now().toString().slice(-6)}` : undefined,
          grade: role === 'guest_student' ? '12' : undefined,
          subjects: role === 'guest_student' ? ['physics', 'chemistry', 'mathematics'] : [],
          isEmailVerified: false,
          totalQuestionsAttempted: 0,
          totalQuestionsCorrect: 0,
          averageScore: 0,
          learningStreak: 0,
          accuracyPercentage: 0,
          isGuest: true
        };

        set((state) => {
          state.user = guestUser;
          state.accessToken = 'guest_token';
          state.refreshTokenValue = 'guest_refresh_token';
          state.loading = false;
          state.error = null;
        });

        // Store guest session in localStorage (only in browser)
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', 'guest_token');
          localStorage.setItem('refreshToken', 'guest_refresh_token');
          localStorage.setItem('isGuest', 'true');
          localStorage.setItem('guestRole', role);
        }
      },

      logout: async () => {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          set((state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshTokenValue = null;
            state.error = null;
          });
          return;
        }
        
        const isGuest = localStorage.getItem('isGuest') === 'true';
        
        if (!isGuest) {
          try {
            await api.post('/auth/logout');
          } catch (error) {
            // Ignore logout errors
          }
        }
        
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshTokenValue = null;
          state.error = null;
        });

        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('guestRole');
      },

      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh-token');
          const { accessToken, refreshToken } = response.data.data;

          set((state) => {
            state.accessToken = accessToken;
            state.refreshTokenValue = refreshToken;
          });

          // Update localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          throw error;
        }
      },

      initializeAuth: () => {
        // Check if we're in browser environment
        if (typeof window === 'undefined') return;
        
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const isGuest = localStorage.getItem('isGuest') === 'true';
        const guestRole = localStorage.getItem('guestRole');

        if (isGuest && guestRole) {
          // Restore guest user
          const guestUser: User = {
            id: `guest_${Date.now()}`,
            email: `${guestRole}@guest.local`,
            fullName: guestRole === 'guest_student' ? 'Guest Student' : 'Guest Instructor',
            username: guestRole === 'guest_student' ? 'guest_student' : 'guest_instructor',
            role: guestRole as 'guest_student' | 'guest_instructor',
            avatar: undefined,
            studentId: guestRole === 'guest_student' ? `GUEST${Date.now().toString().slice(-6)}` : undefined,
            grade: guestRole === 'guest_student' ? '12' : undefined,
            subjects: guestRole === 'guest_student' ? ['physics', 'chemistry', 'mathematics'] : [],
            isEmailVerified: false,
            totalQuestionsAttempted: 0,
            totalQuestionsCorrect: 0,
            averageScore: 0,
            learningStreak: 0,
            accuracyPercentage: 0,
            isGuest: true
          };

          set((state) => {
            state.user = guestUser;
            state.accessToken = accessToken;
            state.refreshTokenValue = refreshToken;
          });
        } else if (accessToken && refreshToken) {
          set((state) => {
            state.accessToken = accessToken;
            state.refreshTokenValue = refreshToken;
          });

          // Verify token and get user info
          api.get('/auth/me')
            .then((response) => {
              set((state) => {
                state.user = response.data.data.user;
              });
            })
            .catch(() => {
              // Token invalid, clear auth state
              get().logout();
            });
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      updateUser: (userData) => {
        set((state) => {
          if (state.user) {
            Object.assign(state.user, userData);
          }
        });
      },
    })),
    {
      name: 'lms-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshTokenValue: state.refreshTokenValue,
      }),
    }
  )
);
