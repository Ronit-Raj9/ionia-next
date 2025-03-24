'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore } from './store';
import React, { ReactNode, useRef } from 'react';

// Create a client-side store
const { store: clientStore, persistor: clientPersistor } = makeStore();

export function ReduxProvider({ children }: { children: ReactNode }) {
  // Use useRef to ensure the store and persistor are created only once
  const storeRef = useRef(clientStore);
  const persistorRef = useRef(clientPersistor);

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistorRef.current}>
        {children}
      </PersistGate>
    </Provider>
  );
}
