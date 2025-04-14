"use client";

import React from 'react';
import { CheckCircleIcon, XCircleIcon, MinusCircleIcon, BookmarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SummarySidebarProps {
  performance: {
    totalCorrect: number;
    totalIncorrect: number;
    totalSkipped: number;
    totalQuestions: number;
  };
  bookmarkedCount: number;
  darkMode: boolean;
}

const SummarySidebar: React.FC<SummarySidebarProps> = ({
  performance,
  bookmarkedCount,
  darkMode,
}) => {
  const {
    totalCorrect,
    totalIncorrect,
    totalSkipped,
    totalQuestions,
  } = performance;

  // Calculate accuracy
  const accuracy = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  // Calculate attempted questions
  const totalAttempted = totalCorrect + totalIncorrect;

  // Calculate completion
  const completion = totalQuestions > 0
    ? Math.round((totalAttempted / totalQuestions) * 100)
    : 0;

  return (
    <div className={`rounded-lg shadow-md overflow-hidden sticky top-44 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className="text-lg font-semibold mb-2">Summary</h3>
      </div>

      <div className="p-4">
        {/* Performance Stats */}
        <div className="space-y-4">
          {/* Correct Answers */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}>
              <CheckCircleIcon className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Correct</span>
                <span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{totalCorrect}/{totalQuestions}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${(totalCorrect / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Incorrect Answers */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-red-900' : 'bg-red-100'}`}>
              <XCircleIcon className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Incorrect</span>
                <span className={`text-sm font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{totalIncorrect}/{totalQuestions}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full" 
                  style={{ width: `${(totalIncorrect / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Skipped Questions */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <MinusCircleIcon className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Skipped</span>
                <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{totalSkipped}/{totalQuestions}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-gray-500 rounded-full" 
                  style={{ width: `${(totalSkipped / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Bookmarked Questions */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${darkMode ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
              <BookmarkIcon className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bookmarked</span>
                <span className={`text-sm font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{bookmarkedCount}/{totalQuestions}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full" 
                  style={{ width: `${(bookmarkedCount / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* Accuracy */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <div className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-blue-700'}`}>Accuracy</div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>{accuracy}%</div>
          </div>

          {/* Completion */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-purple-50'}`}>
            <div className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-purple-700'}`}>Completion</div>
            <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>{completion}%</div>
          </div>
        </div>

        {/* Overall Score Chart */}
        <div className="mt-6">
          <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Score Breakdown</h4>
          <div className="w-full h-4 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${(totalCorrect / totalQuestions) * 100}%` }}
              title={`Correct: ${totalCorrect}`}
            ></div>
            <div 
              className="h-full bg-red-500" 
              style={{ width: `${(totalIncorrect / totalQuestions) * 100}%` }}
              title={`Incorrect: ${totalIncorrect}`}
            ></div>
            <div 
              className="h-full bg-gray-400" 
              style={{ width: `${(totalSkipped / totalQuestions) * 100}%` }}
              title={`Skipped: ${totalSkipped}`}
            ></div>
          </div>
          <div className="flex text-xs mt-2 justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span>Correct</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
              <span>Incorrect</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-gray-400 mr-1"></div>
              <span>Skipped</span>
            </div>
          </div>
        </div>

        {/* Print & Export */}
        <div className="mt-6 flex justify-center gap-3">
          <button className={`px-3 py-2 text-sm font-medium rounded-md ${
            darkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}>
            Print Report
          </button>
          <button className={`px-3 py-2 text-sm font-medium rounded-md ${
            darkMode 
              ? 'bg-blue-700 hover:bg-blue-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummarySidebar; 