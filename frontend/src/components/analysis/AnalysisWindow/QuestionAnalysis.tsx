"use client";
import React, { useState } from 'react';
import { QuestionAnalysisType } from '@/types/analysis';
import { FiClock, FiCheck, FiX, FiMinus } from 'react-icons/fi';
import { useAppSelector } from '@/redux/hooks/hooks';

interface QuestionAnalysisProps {
  id: string;
}

interface QuestionMetadata {
  questionNumber: number;
  subject: string;
  topic: string;
  difficulty: string;
  correctOption: number;
  timeSpent: number;
  status: 'correct' | 'incorrect' | 'unattempted';
  userAnswer: string | null;
  correctAnswer: string;
}

const QuestionAnalysis: React.FC<QuestionAnalysisProps> = ({ id }) => {
  const { answers, metadata } = useAppSelector((state) => state.analysis);
  const [sortField, setSortField] = useState<string>('questionNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filter questions based on activeSubject
  const questions = id === 'Overall' 
    ? metadata.questions 
    : metadata.questions?.filter(q => q.subject === id);
    
  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">Question Analysis</h3>
        <div className="flex justify-center items-center h-40 text-gray-500">
          No question data available
        </div>
      </div>
    );
  }
  
  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Sort questions
  const sortedQuestions = [...questions].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'questionNumber') {
      comparison = a.questionNumber - b.questionNumber;
    } else if (sortField === 'timeSpent') {
      comparison = a.timeSpent - b.timeSpent;
    } else if (sortField === 'status') {
      const statusOrder = { correct: 0, incorrect: 1, unattempted: 2 };
      comparison = statusOrder[a.status] - statusOrder[b.status];
    } else if (sortField === 'subject') {
      comparison = a.subject.localeCompare(b.subject);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'correct':
        return { icon: <FiCheck className="text-green-500" />, color: 'bg-green-100 text-green-800' };
      case 'incorrect':
        return { icon: <FiX className="text-red-500" />, color: 'bg-red-100 text-red-800' };
      case 'unattempted':
        return { icon: <FiMinus className="text-gray-500" />, color: 'bg-gray-100 text-gray-800' };
      default:
        return { icon: <FiMinus className="text-gray-500" />, color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4">Question Analysis</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('questionNumber')}
              >
                Q.No
                {sortField === 'questionNumber' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              {id === 'Overall' && (
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('subject')}
                >
                  Subject
                  {sortField === 'subject' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              )}
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status
                {sortField === 'status' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('timeSpent')}
              >
                Time Spent
                {sortField === 'timeSpent' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Your Answer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Correct Answer
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedQuestions.map((question, index) => {
              const statusInfo = getStatusInfo(question.status);
              
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {question.questionNumber}
                  </td>
                  {id === 'Overall' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {question.subject}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.icon}
                      <span className="ml-1 capitalize">{question.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiClock className="mr-1 text-blue-500" />
                      {formatTime(question.timeSpent)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {question.userAnswer || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {question.correctAnswer}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionAnalysis; 