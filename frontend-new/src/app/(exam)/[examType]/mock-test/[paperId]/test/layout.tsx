import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Window',
  description: 'Take your test in a distraction-free environment',
};

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="test-layout min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
