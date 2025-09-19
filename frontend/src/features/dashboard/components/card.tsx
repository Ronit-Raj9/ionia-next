// components/ui/card.tsx
"use client";
import { ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
