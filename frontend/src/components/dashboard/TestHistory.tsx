"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FiBarChart2, FiClock, FiCalendar, FiCheckCircle, FiXCircle, FiArrowUp, FiArrowDown, FiFileText } from 'react-icons/fi';
import { TestResults } from '@/redux/slices/testSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface TestHistoryProps {
  testHistory: Record<string, TestResults>;
  testDetails: Record<string, { title: string; examType: string; subject: string }>;
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
};

const TestHistory: React.FC<TestHistoryProps> = ({ testHistory, testDetails }) => {
  console.log('TestHistory rendering with data:', { testHistoryLength: Object.keys(testHistory).length, testDetailsLength: Object.keys(testDetails).length });
  
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    console.log('TestHistory data check:', { 
      testHistoryLength: Object.keys(testHistory).length, 
      testDetailsLength: Object.keys(testDetails).length 
    });
  }, [testHistory, testDetails]);

  // Convert testHistory object to array for sorting
  const historyArray = useMemo(() => {
    try {
      return Object.entries(testHistory).map(([paperId, results]) => {
        try {
          // Try to parse the date from the paperId
          let date: Date;
          try {
            const timestamp = parseInt(paperId.substring(0, 8), 16) * 1000;
            date = new Date(timestamp);
            // Check if date is valid
            if (isNaN(date.getTime())) {
              // If not valid, use current date as fallback
              date = new Date();
            }
          } catch (err) {
            console.error("Error parsing date from paperId:", paperId, err);
            date = new Date(); // Fallback to current date
          }

          return {
            ...results,
            title: testDetails[paperId]?.title || 'Unknown Test',
            examType: testDetails[paperId]?.examType || 'Unknown',
            subject: testDetails[paperId]?.subject || 'Unknown',
            date
          };
        } catch (err) {
          console.error("Error processing test:", paperId, err);
          return null;
        }
      }).filter(Boolean);
    } catch (err) {
      console.error("Error processing test history:", err);
      return [];
    }
  }, [testHistory, testDetails]);

  // Sort the history array
  const sortedHistory = useMemo(() => {
    try {
      return [...historyArray].sort((a, b) => {
        if (!a || !b) return 0;
        if (sortBy === 'date') {
          return sortOrder === 'asc' 
            ? a.date.getTime() - b.date.getTime() 
            : b.date.getTime() - a.date.getTime();
        } else {
          return sortOrder === 'asc' 
            ? a.score - b.score 
            : b.score - a.score;
        }
      });
    } catch (err) {
      console.error("Error sorting test history:", err);
      return historyArray;
    }
  }, [historyArray, sortBy, sortOrder]);

  // Format date
  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid Date";
    }
  };

  // Toggle sort order
  const toggleSort = (field: 'date' | 'score') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Test History
            </h3>
            {error && (
              <motion.p 
                className="text-red-500 text-sm mt-1 flex items-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <FiXCircle className="w-4 h-4 mr-1" />
                {error}
              </motion.p>
            )}
          </div>
          <div className="flex space-x-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSort('date')}
              className={`px-4 py-2 text-sm rounded-xl flex items-center space-x-2 transition-colors duration-200 ${
                sortBy === 'date' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              <FiCalendar className="w-4 h-4" />
              <span>Date</span>
              {sortBy === 'date' && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  {sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
                </motion.span>
              )}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleSort('score')}
              className={`px-4 py-2 text-sm rounded-xl flex items-center space-x-2 transition-colors duration-200 ${
                sortBy === 'score' 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              <FiBarChart2 className="w-4 h-4" />
              <span>Score</span>
              {sortBy === 'score' && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  {sortOrder === 'asc' ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {sortedHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedHistory.filter(test => test !== null).map((test) => {
                  try {
                    // Calculate accuracy
                    const accuracy = test.correctAnswers && (test.correctAnswers + test.incorrectAnswers) > 0 
                      ? (test.correctAnswers / (test.correctAnswers + test.incorrectAnswers) * 100) 
                      : 0;
                    
                    // Format time
                    const minutes = Math.floor(test.timeTaken / 60) || 0;
                    const seconds = test.timeTaken % 60 || 0;
                    const formattedTime = `${minutes}m ${seconds}s`;
                    
                    return (
                      <motion.tr 
                        key={test.paperId}
                        variants={itemVariants}
                        onHoverStart={() => setHoveredRow(test.paperId)}
                        onHoverEnd={() => setHoveredRow(null)}
                        className={`border-b border-gray-50 transition-colors duration-200 ${
                          hoveredRow === test.paperId ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <FiFileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{test.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{test.subject} | {test.examType}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(test.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm font-medium ${
                            test.score >= 70 ? 'text-green-600' : 
                            test.score >= 40 ? 'text-amber-600' : 
                            'text-red-600'
                          }`}>
                            {test.score?.toFixed(1) || '0.0'}%
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {test.correctAnswers || 0}/{test.correctAnswers + test.incorrectAnswers + test.unattempted || 0} correct
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {accuracy >= 70 ? (
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                <FiCheckCircle className="w-4 h-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                <FiXCircle className="w-4 h-4 text-red-600" />
                              </div>
                            )}
                            <span className="text-sm font-medium">{accuracy.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <FiClock className="w-4 h-4 mr-2 text-gray-400" />
                            {formattedTime}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link 
                              href={`/results?paperId=${test.paperId}`}
                              className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors duration-200"
                            >
                              <FiBarChart2 className="w-4 h-4" />
                              <span>View Analysis</span>
                            </Link>
                          </motion.div>
                        </td>
                      </motion.tr>
                    );
                  } catch (err) {
                    console.error("Error rendering test row:", test.paperId, err);
                    return null;
                  }
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      ) : (
        <motion.div 
          className="py-16 text-center"
          variants={containerVariants}
        >
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <FiFileText className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">No test history available.</p>
          <p className="text-gray-400 text-sm mt-2">Take a test to see your performance history.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TestHistory; 