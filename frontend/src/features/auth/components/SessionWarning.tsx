// ==========================================
// ⚠️ SIMPLE SESSION WARNING COMPONENT
// ==========================================

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionWarningProps {
  isVisible: boolean;
  timeRemaining: string;
  onExtend: () => void;
  onLogout: () => void;
}

const SessionWarning: React.FC<SessionWarningProps> = ({
  isVisible,
  timeRemaining,
  onExtend,
  onLogout,
}) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-50 p-4 bg-yellow-100 border-b-2 border-yellow-400"
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-yellow-800">
              Session expires in {timeRemaining}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onExtend}
              className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
            >
              Extend
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default SessionWarning;
