import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import { HYDRATE } from 'next-redux-wrapper';

// Define UI state interface
interface UIState {
  isNavbarOpen: boolean;
  isLoading: boolean;
  notifications: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>;
}

// Initial state
const initialState: UIState = {
  isNavbarOpen: false,
  isLoading: false,
  notifications: [],
};

// 

// Create the UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleNavbar: (state) => {
      state.isNavbarOpen = !state.isNavbarOpen;
    },
    setNavbarOpen: (state, action: PayloadAction<boolean>) => {
      state.isNavbarOpen = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addNotification: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'info' | 'warning';
    }>) => {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        ...action.payload,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(HYDRATE, (state, action: AnyAction) => {
      if (action.payload && typeof action.payload === 'object' && 'ui' in action.payload) {
        return {
          ...state,
          ...action.payload.ui,
        };
      }
      return state;
    });
  },
});

export const {
  toggleNavbar,
  setNavbarOpen,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;
export default uiSlice.reducer; 