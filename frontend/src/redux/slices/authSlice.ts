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
  async (_, { dispatch }) => {
    const accessToken = localStorage.getItem('accessToken');
    const lastRefresh = localStorage.getItem('lastTokenRefresh');
    
    if (!accessToken) return;

    try {
      // Always get fresh user data
      await dispatch(getCurrentUser());
      
      // Check if token needs refresh
      const shouldRefresh = lastRefresh && 
        (Date.now() - parseInt(lastRefresh)) > 30 * 60 * 1000;
      
      if (shouldRefresh) {
        const refreshResponse = await API.auth.refreshToken();
        if (refreshResponse.data.accessToken) {
          localStorage.setItem('accessToken', refreshResponse.data.accessToken);
          localStorage.setItem('lastTokenRefresh', Date.now().toString());
          // Get fresh user data after token refresh
          await dispatch(getCurrentUser());
        }
      }
    } catch (error) {
      // On error, clear auth state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('lastTokenRefresh');
      return;
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
      localStorage.setItem('redirectTo', action.payload);
    },
    updateLastTokenRefresh: (state) => {
      state.lastTokenRefresh = Date.now();
      localStorage.setItem('lastTokenRefresh', state.lastTokenRefresh.toString());
    },
    refreshUserData: (state) => {
      // This will trigger a re-fetch of user data
      state.loading = true;
    },
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
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
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
        // Clear API cache to ensure fresh data
        if (typeof window !== 'undefined') {
          // Import dynamically to avoid circular dependency
          import('@/lib/api').then(({ clearCache }) => {
            clearCache();
          });
        }
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.lastTokenRefresh = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('lastTokenRefresh');
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