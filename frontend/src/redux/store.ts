import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// Import your slice reducers
import testReducer from './slices/testSlice';
import authReducer from './slices/authSlice';
import analysisReducer from './slices/analysisSlice';
import timeTrackingReducer from './slices/timeTrackingSlice';
import uiReducer from './slices/uiSlice';
import questionReducer from './slices/questionSlice';

// Combine all your reducers
const rootReducer = combineReducers({
  test: testReducer,
  auth: authReducer,
  analysis: analysisReducer,
  timeTracking: timeTrackingReducer,
  ui: uiReducer,
  question: questionReducer,
});

// Configuration for redux-persist
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  // Whitelist reducers you wish to persist (adjust as needed)
  whitelist: ['auth', 'test'],
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Add error handling middleware
const apiErrorLoggerMiddleware = (store: any) => (next: any) => (action: any) => {
  // Log rejected actions (API errors)
  if (action.type.endsWith('/rejected')) {
    console.group(`🚨 API Error: ${action.type}`);
    console.error('Error payload:', action.payload);
    console.error('Error details:', action.error);
    console.groupEnd();
  }
  return next(action);
};

// Create the store using the persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Define RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
