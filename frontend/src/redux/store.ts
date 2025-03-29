import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

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
  storage,
  // Whitelist reducers you wish to persist (adjust as needed)
  whitelist: ['auth', 'test'],
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create the store using the persisted reducer
export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Disable serializable check for redux-persist
      }),
  });

  const persistor = persistStore(store);
  return { store, persistor };
};

// Define RootState and AppDispatch types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof makeStore>['store']['dispatch'];

// Create store instance
const { store, persistor } = makeStore();
// Export both store and persistor
export { persistor };
export default store;
