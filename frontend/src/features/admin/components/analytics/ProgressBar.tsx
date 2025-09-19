"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  showPercentage?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  maxValue,
  color = 'blue',
  showPercentage = false,
  className = ''
}) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  
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
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;
  };

  return (
    <div className={`flex items-center ${className}`}>
      <span className="w-24 text-sm text-gray-600 capitalize truncate" title={label}>
        {label}
      </span>
      
      <div className="flex-1 mx-4">
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${getBgColor(color)} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-right">
          {value.toLocaleString()}
        </span>
        {showPercentage && (
          <span className="text-xs text-gray-500 min-w-[3rem] text-right">
            ({percentage.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;