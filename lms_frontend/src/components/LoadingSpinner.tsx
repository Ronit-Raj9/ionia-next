"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, BookOpen, Brain, Users, BarChart3 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bounce';
  icon?: 'default' | 'book' | 'brain' | 'users' | 'chart';
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const iconMap = {
  default: Loader2,
  book: BookOpen,
  brain: Brain,
  users: Users,
  chart: BarChart3
};

export default function LoadingSpinner({
  size = 'md',
  text,
  variant = 'default',
  icon = 'default',
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const IconComponent = iconMap[icon];
  const sizeClass = sizeClasses[size];

  const containerClasses = fullScreen
    ? 'min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50'
    : 'flex items-center justify-center p-4';

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`${sizeClass} bg-emerald-500 rounded-full`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
        );

      case 'bounce':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-emerald-500 rounded-full"
                animate={{
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        );

      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <IconComponent className={`${sizeClass} text-emerald-500`} />
          </motion.div>
        );
    }
  };

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {renderSpinner()}
        </div>
        {text && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-sm font-medium"
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
}

// Predefined loading components for common use cases
export function PageLoading() {
  return (
    <LoadingSpinner
      size="xl"
      text="Loading page..."
      variant="pulse"
      icon="book"
      fullScreen
    />
  );
}

export function DataLoading() {
  return (
    <LoadingSpinner
      size="lg"
      text="Loading data..."
      variant="dots"
      icon="chart"
    />
  );
}

export function FormLoading() {
  return (
    <LoadingSpinner
      size="md"
      text="Processing..."
      variant="bounce"
      icon="brain"
    />
  );
}

export function StudentLoading() {
  return (
    <LoadingSpinner
      size="lg"
      text="Loading student data..."
      variant="pulse"
      icon="users"
    />
  );
}
