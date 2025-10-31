"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Users, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface JoinClassroomProps {
  userId: string;
  userName: string;
  userEmail: string;
  onClassJoined?: (classroomData: any) => void;
  onClose?: () => void;
}

export default function JoinClassroom({ userId, userName, userEmail, onClassJoined, onClose }: JoinClassroomProps) {
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a join code');
      return;
    }

    setJoining(true);
    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          joinCode: joinCode.trim().toUpperCase(),
          studentId: userId,
          studentName: userName,
          studentEmail: userEmail
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Successfully joined the classroom!');
        setJoinCode('');
        setShowForm(false);
        
        // Update the user's classId in localStorage and context
        const currentUser = JSON.parse(localStorage.getItem('ionia_user') || '{}');
        if (currentUser.userId === userId) {
          currentUser.classId = data.data.classroomId;
          localStorage.setItem('ionia_user', JSON.stringify(currentUser));
          
          // Trigger a page refresh to update the user context
          window.location.reload();
        }
        
        onClassJoined?.(data.data);
      } else {
        toast.error(data.error || 'Failed to join classroom');
      }
    } catch (error) {
      console.error('Error joining classroom:', error);
      toast.error('Failed to join classroom');
    } finally {
      setJoining(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinClass();
    }
  };

  return (
    <div className="space-y-4">
      {/* Join Classroom Button */}
      {!showForm && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Join Classroom with Code</span>
        </motion.button>
      )}

      {/* Join Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">Join a Classroom</h3>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Join Code
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., 68F9BQZNF"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                  maxLength={10}
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Ask your teacher for the join code
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinClass}
                  disabled={joining || !joinCode.trim()}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
                >
                  {joining ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Join Class</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-emerald-700">
                  <p className="font-medium mb-1">How to get a join code:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Ask your teacher for the classroom join code</li>
                    <li>Join codes are usually 9-10 characters long</li>
                    <li>Make sure you're joining the correct class</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
