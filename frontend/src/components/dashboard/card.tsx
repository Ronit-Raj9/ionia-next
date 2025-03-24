// components/ui/card.tsx
"use client";
import { ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}
