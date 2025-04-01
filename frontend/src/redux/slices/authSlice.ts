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
}

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  isAuthenticated: false,
  loading: false,
  error: null,
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
      // First remove the token from localStorage immediately to ensure client-side logout
      localStorage.removeItem('accessToken');
      
      // Then attempt to notify the server (but client is already logged out)
      await API.auth.logout().catch(error => {
        console.error('Server logout failed, but proceeding with client-side logout:', error);
        // We'll still complete the logout locally even if the server request fails
      });
      
      return; // Successfully logged out
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we want to clear the local session
      localStorage.removeItem('accessToken');
      // Still reject with value for tracking purposes, but UI should treat logout as successful
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
      return rejectWithValue(error.response?.data?.message || 'Failed to get user data');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { dispatch }) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      await dispatch(getCurrentUser());
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
      // Store the redirect path for after login
      // This doesn't need to be in the state since we're not using it for rendering
      // but we'll keep the action for compatibility
      localStorage.setItem('redirectTo', action.payload);
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
      })
      .addCase(logout.rejected, (state) => {
        // Even if the server-side logout failed, we still want to log out on the client
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
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
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        localStorage.removeItem('accessToken');
      });
  },
});

export const { clearError, setRedirectTo } = authSlice.actions;
export default authSlice.reducer; 