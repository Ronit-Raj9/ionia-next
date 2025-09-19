// frontend/src/features/admin/components/audit/AuditLogs.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineClock, HiOutlineUser, HiOutlineGlobe, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

interface AuditLog {
  _id: string;
  event: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details: any;
  authMethod?: string;
  success: boolean;
  error?: {
    message: string;
    code: string;
  };
  createdAt: string;
}

interface AuditLogsProps {
  className?: string;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, [filter, page]);

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call to fetch audit logs
      // const response = await adminAPI.getAuditLogs({ filter, page });
      // setLogs(prev => page === 1 ? response.logs : [...prev, ...response.logs]);
      // setHasMore(response.hasMore);
      
      // Mock data for now
      const mockLogs: AuditLog[] = [
        {
          _id: '1',
          event: 'login_success',
          userId: 'user123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          details: { authMethod: 'email' },
          authMethod: 'email',
          success: true,
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          event: 'login_failed',
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0...',
          details: { attemptedEmail: 'test@example.com', reason: 'Invalid password' },
          authMethod: 'email',
          success: false,
          error: { message: 'Invalid password', code: 'INVALID_CREDENTIALS' },
          createdAt: new Date(Date.now() - 60000).toISOString()
        }
      ];
      
      setLogs(mockLogs);
      setHasMore(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'login_success':
      case 'google_oauth_login':
        return <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />;
      case 'login_failed':
      case 'account_locked':
        return <HiOutlineXCircle className="w-4 h-4 text-red-500" />;
      default:
        return <HiOutlineClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEventName = (event: string) => {
    return event.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getEventColor = (event: string, success: boolean) => {
    if (!success) return 'text-red-600 dark:text-red-400';
    if (event.includes('success')) return 'text-green-600 dark:text-green-400';
    if (event.includes('failed')) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading && page === 1) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Audit Logs
          </h3>
          
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Events</option>
            <option value="login_success">Successful Logins</option>
            <option value="login_failed">Failed Logins</option>
            <option value="google_oauth">Google OAuth</option>
            <option value="security">Security Events</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {logs.map((log) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(log.event)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${getEventColor(log.event, log.success)}`}>
                      {getEventName(log.event)}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <HiOutlineGlobe className="w-3 h-3" />
                      <span>{log.ipAddress}</span>
                    </div>
                    
                    {log.authMethod && (
                      <div className="flex items-center space-x-1">
                        <HiOutlineUser className="w-3 h-3" />
                        <span>{log.authMethod}</span>
                      </div>
                    )}
                  </div>
                  
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <details className="cursor-pointer">
                        <summary className="hover:text-gray-800 dark:hover:text-gray-200">
                          View Details
                        </summary>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-600 rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                  
                  {log.error && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      Error: {log.error.message}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {logs.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No audit logs found
            </div>
          )}
          
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-emerald-600 hover:text-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AuditLogs;
