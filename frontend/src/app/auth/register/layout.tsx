'use client';

import { ReduxProvider } from '@/redux/provider';

export default function RegisterLayout({
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