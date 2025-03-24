"use client";

import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import store from '@/redux/store';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        {children}
      </Provider>
    </ErrorBoundary>
  );
} 