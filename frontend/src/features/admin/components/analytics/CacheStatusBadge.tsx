"use client";

import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAnalyticsCache } from '../../hooks/useAnalyticsCache';

interface CacheStatusBadgeProps {
  className?: string;
}

const CacheStatusBadge: React.FC<CacheStatusBadgeProps> = ({ className = '' }) => {
  const { hasCachedData, lastFetched, isStale, getCacheInfo } = useAnalyticsCache();

  const formatCacheAge = (timestamp: number | null): string => {
    if (!timestamp) return 'Unknown';
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!hasCachedData) {
    return null;
  }

  const getStatusIcon = () => {
    if (isStale) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isStale) {
      return 'Data may be outdated';
    }
    return `Data cached ${formatCacheAge(lastFetched)}`;
  };

  const getStatusColor = () => {
    if (isStale) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      {getStatusIcon()}
      <span className={getStatusColor()}>
        {getStatusText()}
      </span>
    </div>
  );
};

export default CacheStatusBadge;
