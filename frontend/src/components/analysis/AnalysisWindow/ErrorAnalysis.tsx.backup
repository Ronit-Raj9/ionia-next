import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

interface ErrorPattern {
  conceptualErrors: string[];
  calculationErrors: string[];
  timeManagementErrors: string[];
  carelessMistakes: string[];
}

interface Mistake {
  questionId: string;
  selectedOption?: number;
  correctOption?: number;
  conceptTested?: string;
  timeSpentBeforeError?: number;
}

interface Question {
  id: string;
  topic?: string;
}

interface ErrorAnalysisProps {
  data: any;
}

const ErrorAnalysis: React.FC<ErrorAnalysisProps> = ({ data }) => {
  const { errorAnalytics, metadata } = data || {};
  const [selectedErrorType, setSelectedErrorType] = useState('all');

  // Ensure we have the data with safe fallbacks
  const commonMistakes: Mistake[] = errorAnalytics?.commonMistakes || [];
  const errorPatterns: ErrorPattern = errorAnalytics?.errorPatterns || {
    conceptualErrors: [],
    calculationErrors: [],
    timeManagementErrors: [],
    carelessMistakes: []
  };
  const questions: Question[] = metadata?.questions || [];

  // Error types data for pie chart
  const errorTypesData = [
    { name: 'Conceptual', value: errorPatterns.conceptualErrors.length, color: '#EF4444' },
    { name: 'Calculation', value: errorPatterns.calculationErrors.length, color: '#F59E0B' },
    { name: 'Time Management', value: errorPatterns.timeManagementErrors.length, color: '#8B5CF6' },
    { name: 'Careless', value: errorPatterns.carelessMistakes.length, color: '#10B981' },
  ];

  // Filter mistakes based on selected error type
  const filteredMistakes = selectedErrorType === 'all'
    ? commonMistakes
    : commonMistakes.filter((mistake: Mistake) => {
        switch(selectedErrorType) {
          case 'conceptual':
            return errorPatterns.conceptualErrors.includes(mistake.questionId);
          case 'calculation':
            return errorPatterns.calculationErrors.includes(mistake.questionId);
          case 'timeManagement':
            return errorPatterns.timeManagementErrors.includes(mistake.questionId);
          case 'careless':
            return errorPatterns.carelessMistakes.includes(mistake.questionId);
          default:
            return true;
        }
      });

  // Data for time spent before error chart
  const timeSpentData = filteredMistakes.map(mistake => ({
    question: `Q${mistake.questionId ? mistake.questionId.slice(-3) : 'unknown'}`,
    timeSpent: Math.round((mistake.timeSpentBeforeError || 0) / 1000), // Convert to seconds
  })).slice(0, 10); // Show only top 10

  // Handle the case when there's no data
  if (commonMistakes.length === 0 && 
      errorTypesData.every(item => item.value === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-16 h-16 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No Error Analysis Available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Error analytics data is not available for this test attempt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Error Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Types of Errors</h3>
            {errorTypesData.some(item => item.value > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {errorTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} questions`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">No error type data available</p>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Error Breakdown</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>Conceptual Errors: {errorPatterns.conceptualErrors.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                <span>Calculation Errors: {errorPatterns.calculationErrors.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <span>Time Management Errors: {errorPatterns.timeManagementErrors.length}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                <span>Careless Mistakes: {errorPatterns.carelessMistakes.length}</span>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-2">Filter Errors</h4>
              <select
                value={selectedErrorType}
                onChange={(e) => setSelectedErrorType(e.target.value)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Errors</option>
                <option value="conceptual">Conceptual Errors</option>
                <option value="calculation">Calculation Errors</option>
                <option value="timeManagement">Time Management Errors</option>
                <option value="careless">Careless Mistakes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Common Mistakes</h2>
        {filteredMistakes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Answer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correct Answer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concept Tested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMistakes.map((mistake, index) => {
                  const question = questions.find(q => q.id === mistake.questionId);
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Q{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-500 font-medium">
                        Option {String.fromCharCode(65 + (mistake.selectedOption || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500 font-medium">
                        Option {String.fromCharCode(65 + (mistake.correctOption || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mistake.conceptTested || (question?.topic || 'Not specified')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(mistake.timeSpentBeforeError || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <p className="text-gray-500">No mistake data available for the selected filter</p>
          </div>
        )}
      </div>

      {timeSpentData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4">Time Spent Before Errors</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeSpentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="question" />
                <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} seconds`, 'Time Spent']} />
                <Legend />
                <Bar dataKey="timeSpent" name="Time Spent (seconds)" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
};

export default ErrorAnalysis; 