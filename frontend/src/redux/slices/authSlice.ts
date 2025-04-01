import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API } from '@/lib/api';

// Types
export interface IUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  name?: string; // Make name optional to maintain compatibility
}

interface LoginResponse {
  user: IUser;
  accessToken: string;
  refreshToken?: string; // Make refreshToken optional to maintain compatibility
}

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  lastTokenRefresh: number | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  isAuthenticated: false,
  loading: false,
  error: null,
  lastTokenRefresh: null,
};

// Async thunks
export const login = createAsyncThunk<
  LoginResponse,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const response = await API.auth.login(email, password);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('lastTokenRefresh', Date.now().toString());
    }
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const register = createAsyncThunk<
  LoginResponse,
  { fullName: string; email: string; username: string; password: string },
  { rejectValue: string }
>('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await API.auth.register(userData);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('lastTokenRefresh', Date.now().toString());
    }
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear all auth-related data from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('lastTokenRefresh');
      localStorage.removeItem('redirectTo');
      
      // Attempt server logout
      await API.auth.logout().catch(error => {
        console.error('Server logout failed:', error);
        // Continue with client-side logout even if server request fails
      });
      
      return;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local session
      localStorage.removeItem('accessToken');
      localStorage.removeItem('lastTokenRefresh');
      localStorage.removeItem('redirectTo');
      return rejectWithValue(error instanceof Error ? error.message : 'Logout failed');
    }
  }
);

export const getCurrentUser = createAsyncThunk<IUser, void, { rejectValue: string }>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.auth.getCurrentUser();
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Clear auth state and redirect without attempting refresh
        localStorage.removeItem('accessToken');
        localStorage.removeItem('lastTokenRefresh');
        return rejectWithValue('Session expired. Please login again.');
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to get user data');
    }
  }
);

export const updateUserData = createAsyncThunk<IUser, void, { rejectValue: string }>(
  'auth/updateUserData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.auth.getCurrentUser();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user data');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { dispatch, rejectWithValue }) => {
    const accessToken = localStorage.getItem('accessToken');
    const lastRefresh = localStorage.getItem('lastTokenRefresh');
    
    if (!accessToken) {
      return rejectWithValue('No access token found');
    }

    try {
      // Get fresh user data
      const userResponse = await dispatch(getCurrentUser()).unwrap();
      
      // Check if token needs refresh
      const shouldRefresh = lastRefresh && 
        (Date.now() - parseInt(lastRefresh)) > 25 * 60 * 1000; // Refresh 5 minutes before expiry
      
      if (shouldRefresh) {
        try {
          const refreshResponse = await API.auth.refreshToken();
          if (refreshResponse.data?.accessToken) {
            localStorage.setItem('accessToken', refreshResponse.data.accessToken);
            localStorage.setItem('lastTokenRefresh', Date.now().toString());
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Don't throw error here, continue with current token
        }
      }
      
      return userResponse;
    } catch (error: any) {
      // Clear auth state on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('lastTokenRefresh');
      return rejectWithValue(error.message || 'Authentication check failed');
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRedirectTo: (state, action) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectTo', action.payload);
      }
    },
    updateLastTokenRefresh: (state) => {
      state.lastTokenRefresh = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastTokenRefresh', state.lastTokenRefresh.toString());
      }
    },
    refreshUserData: (state) => {
      state.loading = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.lastTokenRefresh = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('lastTokenRefresh');
        localStorage.removeItem('redirectTo');
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.lastTokenRefresh = Date.now();
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.lastTokenRefresh = Date.now();
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.lastTokenRefresh = null;
      })
      .addCase(logout.rejected, (state) => {
        // Even if the server-side logout failed, we still want to log out on the client
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.lastTokenRefresh = null;
      })
      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.lastTokenRefresh = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('lastTokenRefresh');
        }
      })
      // Update User Data
      .addCase(updateUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(updateUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setRedirectTo, updateLastTokenRefresh, refreshUserData } = authSlice.actions;
export default authSlice.reducer; 