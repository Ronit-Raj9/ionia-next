"use client";
import React from 'react';

interface SummaryProps {
  id: string;
  data: any;
}

const Summary: React.FC<SummaryProps> = ({ id, data }) => {
  const { performance, testInfo } = data || {};
  
  // Calculate percentages for the pie chart with safety checks
  const totalQuestions = performance?.totalQuestions || 0;
  const correctAnswers = performance?.totalCorrectAnswers || 0;
  const wrongAnswers = performance?.totalWrongAnswers || 0;
  const unattempted = totalQuestions - correctAnswers - wrongAnswers;
  
  const correctPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const incorrectPercentage = totalQuestions > 0 ? Math.round((wrongAnswers / totalQuestions) * 100) : 0;
  const unattemptedPercentage = totalQuestions > 0 ? Math.round((unattempted / totalQuestions) * 100) : 0;
  
  // Format time taken
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };
  
  // Get available subjects
  const subjects = ['Overall', ...(performance?.subjectWise ? Object.keys(performance.subjectWise) : [])];
  
  // Fix accuracy display
  const accuracyValue = performance?.accuracy || 0;
  const formattedAccuracy = typeof accuracyValue === 'number' ? accuracyValue.toFixed(1) : '0.0';
  
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-0">Performance Summary</h3>
        
        {/* Subject selector */}
        {subjects.length > 1 && (
          <select 
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
          >
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 transition-all hover:shadow-md">
          <p className="text-sm text-gray-600 font-medium">Score</p>
          <p className="text-2xl font-bold text-blue-600">{formattedAccuracy}%</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-100 transition-all hover:shadow-md">
          <p className="text-sm text-gray-600 font-medium">Accuracy</p>
          <p className="text-2xl font-bold text-green-600">{formattedAccuracy}%</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-100 transition-all hover:shadow-md">
          <p className="text-sm text-gray-600 font-medium">Time Taken</p>
          <p className="text-2xl font-bold text-purple-600">{formatTime(testInfo?.duration || 0)}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow-sm border border-orange-100 transition-all hover:shadow-md">
          <p className="text-sm text-gray-600 font-medium">Questions</p>
          <p className="text-2xl font-bold text-orange-600">{totalQuestions}</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-6">
        {/* Pie Chart Section */}
        <div className="flex items-center justify-center mx-auto md:mx-0 max-w-xs">
          <div className="relative">
            {/* Fixed SVG Pie Chart */}
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle 
                cx="90" 
                cy="90" 
                r="80" 
                fill="transparent" 
                stroke="#f3f4f6" 
                strokeWidth="20"
              />
              
              {/* Calculate circumference = 2πr */}
              {(() => {
                const radius = 80;
                const circumference = 2 * Math.PI * radius;
                
                // Start all segments from the top (0 degrees)
                let currentOffset = 0;
                const segments = [];
                
                // Only render segments > 0
                if (correctPercentage > 0) {
                  const correctLength = (correctPercentage / 100) * circumference;
                  segments.push(
                    <circle 
                      key="correct"
                      cx="90" 
                      cy="90" 
                      r="80" 
                      fill="transparent"
                      stroke="#10b981" 
                      strokeWidth="20"
                      strokeDasharray={`${correctLength} ${circumference - correctLength}`}
                      strokeDashoffset={currentOffset}
                      transform="rotate(-90, 90, 90)"
                    />
                  );
                  currentOffset -= correctLength;
                }
                
                if (incorrectPercentage > 0) {
                  const incorrectLength = (incorrectPercentage / 100) * circumference;
                  segments.push(
                    <circle 
                      key="incorrect"
                      cx="90" 
                      cy="90" 
                      r="80" 
                      fill="transparent"
                      stroke="#ef4444" 
                      strokeWidth="20"
                      strokeDasharray={`${incorrectLength} ${circumference - incorrectLength}`}
                      strokeDashoffset={currentOffset}
                      transform="rotate(-90, 90, 90)"
                    />
                  );
                  currentOffset -= incorrectLength;
                }
                
                if (unattemptedPercentage > 0) {
                  const unattemptedLength = (unattemptedPercentage / 100) * circumference;
                  segments.push(
                    <circle 
                      key="unattempted"
                      cx="90" 
                      cy="90" 
                      r="80" 
                      fill="transparent"
                      stroke="#9ca3af" 
                      strokeWidth="20"
                      strokeDasharray={`${unattemptedLength} ${circumference - unattemptedLength}`}
                      strokeDashoffset={currentOffset}
                      transform="rotate(-90, 90, 90)"
                    />
                  );
                }
                
                return segments;
              })()}
              
              {/* Center text showing accuracy */}
              <text 
                x="90" 
                y="90" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-3xl font-bold" 
                fill="#3b82f6"
              >
                {formattedAccuracy}%
              </text>
              <text 
                x="90" 
                y="110" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-sm" 
                fill="#6b7280"
              >
                Accuracy
              </text>
            </svg>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-md mx-auto md:mx-0">
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-center mb-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span className="text-sm font-medium ml-2">Correct</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{correctAnswers}</p>
            <p className="text-xs text-gray-500">{correctPercentage}%</p>
          </div>
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-center mb-2">
              <span className="w-4 h-4 bg-red-500 rounded-full"></span>
              <span className="text-sm font-medium ml-2">Incorrect</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{wrongAnswers}</p>
            <p className="text-xs text-gray-500">{incorrectPercentage}%</p>
          </div>
          <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center justify-center mb-2">
              <span className="w-4 h-4 bg-gray-400 rounded-full"></span>
              <span className="text-sm font-medium ml-2">Unattempted</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{unattempted}</p>
            <p className="text-xs text-gray-500">{unattemptedPercentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
