"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  name: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  description: string;
  isLoading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  name,
  value,
  icon: Icon,
  color,
  description,
  isLoading = false,
  trend,
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    indigo: 'bg-indigo-600',
    yellow: 'bg-yellow-600',
    pink: 'bg-pink-600',
    red: 'bg-red-600',
    gray: 'bg-gray-600'
  };

  const getBgColor = (color: string) => {
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray;
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <dt>
        <div className={`absolute rounded-lg ${getBgColor(color)} p-3`}>
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <p className="ml-16 truncate text-sm font-medium text-gray-500">{name}</p>
        <p className="ml-16 truncate text-xs text-gray-400">{description}</p>
      </dt>
      
      <dd className="ml-16 flex items-baseline pt-2">
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <>
            <motion.p 
              className="text-2xl font-semibold text-gray-900"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {value}
            </motion.p>
            
            {trend && (
              <motion.span
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <span className={`inline-block ${trend.isPositive ? 'transform rotate-0' : 'transform rotate-180'}`}>
                  ↗
                </span>
                {Math.abs(trend.value)}%
              </motion.span>
            )}
          </>
        )}
      </dd>
    </motion.div>
  );
};

export default StatCard;