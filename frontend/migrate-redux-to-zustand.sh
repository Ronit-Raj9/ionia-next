#!/bin/bash

# Migration script to replace Redux with Zustand across the codebase
echo "Starting Redux to Zustand migration..."

# Find all TypeScript and TSX files
files=$(find src -name "*.tsx" -o -name "*.ts" | grep -v node_modules)

for file in $files; do
    # Skip if file doesn't exist
    [ ! -f "$file" ] && continue
    
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Replace Redux imports with Zustand equivalents
    sed -i "s|import { useAppDispatch, useAppSelector } from '@/redux/hooks/hooks';||g" "$file"
    sed -i "s|import { useAppSelector, useAppDispatch } from '@/redux/hooks/hooks';||g" "$file"
    sed -i "s|import { useDispatch, useSelector } from 'react-redux';||g" "$file"
    sed -i "s|import { RootState } from '@/redux/store';||g" "$file"
    sed -i "s|import { Provider } from 'react-redux';||g" "$file"
    sed -i "s|import { PersistGate } from 'redux-persist/integration/react';||g" "$file"
    sed -i "s|import store, { persistor } from '@/redux/store';||g" "$file"
    sed -i "s|import { store, persistor } from '@/redux/store';||g" "$file"
    sed -i "s|import { store } from '@/redux/store';||g" "$file"
    
    # Replace Redux slice imports with Zustand store imports
    sed -i "s|import { .* } from '@/redux/slices/authSlice';|import { useAuthStore } from '@/stores/authStore';|g" "$file"
    sed -i "s|import { .* } from '@/redux/slices/testSlice';|import { useTestStore, useCurrentTest, useTestActions, useTestResults } from '@/stores/testStore';|g" "$file"
    sed -i "s|import { .* } from '@/redux/slices/uiSlice';|import { useUIStore, useNotifications } from '@/stores/uiStore';|g" "$file"
    sed -i "s|import { .* } from '@/redux/slices/questionSlice';|import { useQuestionStore, useQuestionForm, useQuestionActions } from '@/stores/questionStore';|g" "$file"
    sed -i "s|import { .* } from '@/redux/slices/analysisSlice';|import { useAnalysisStore, useCurrentAnalysis, useAnalysisActions } from '@/stores/analysisStore';|g" "$file"
    sed -i "s|import { .* } from '@/redux/slices/timeTrackingSlice';|import { useTimeTrackingStore, useTimeTracking } from '@/stores/timeTrackingStore';|g" "$file"
    
    # Replace Redux hooks with Zustand equivalents
    sed -i "s|const dispatch = useAppDispatch();||g" "$file"
    sed -i "s|const dispatch = useDispatch();||g" "$file"
    sed -i "s|useAppSelector((state: RootState) => state\.auth)|useAuthStore()|g" "$file"
    sed -i "s|useSelector((state: RootState) => state\.auth)|useAuthStore()|g" "$file"
    sed -i "s|useAppSelector((state: RootState) => state\.test)|useTestStore()|g" "$file"
    sed -i "s|useAppSelector((state: RootState) => state\.ui)|useUIStore()|g" "$file"
    sed -i "s|useAppSelector((state: RootState) => state\.question)|useQuestionStore()|g" "$file"
    sed -i "s|useAppSelector((state: RootState) => state\.analysis)|useAnalysisStore()|g" "$file"
    sed -i "s|useAppSelector((state: RootState) => state\.timeTracking)|useTimeTrackingStore()|g" "$file"
    
    # Replace dispatch calls with direct store actions
    sed -i "s|dispatch(\([^)]*\));|\1();|g" "$file"
    
    # Remove Provider and PersistGate wrappers
    sed -i "s|<Provider store={store}>||g" "$file"
    sed -i "s|</Provider>||g" "$file"
    sed -i "s|<PersistGate loading={.*} persistor={persistor}>||g" "$file"
    sed -i "s|</PersistGate>||g" "$file"
    
    # Clean up empty lines that might have been created
    sed -i '/^[[:space:]]*$/N;/^\n$/d' "$file"
done

echo "Migration completed! Backup files created with .backup extension"
echo "Please review the changes and test your application"
echo "To restore backups if needed: find src -name '*.backup' -exec sh -c 'mv \"$1\" \"${1%.backup}\"' _ {} \;" 