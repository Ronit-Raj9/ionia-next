// src/app/layout.tsx
'use client';

import { ReduxProvider } from '@/redux/provider';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </ReduxProvider>
  );
}
