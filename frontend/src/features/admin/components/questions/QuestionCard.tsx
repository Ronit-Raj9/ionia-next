"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { useQuestionStore } from '../../store/questionStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from 'react-hot-toast';
import type { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';
  
  const {
    expandedQuestions,
    togglingStatus,
    toggleQuestionExpanded,
    toggleQuestionStatus,
    setShowDeleteModal,
    setSelectedQuestionId
  } = useQuestionStore();

  const isExpanded = expandedQuestions[question._id] || false;

  const handleDelete = () => {
    if (!isSuperAdmin) {
      toast.error('Only superadmins can delete questions');
      return;
    }
    setSelectedQuestionId(question._id);
    setShowDeleteModal(true);
  };

  const handleToggleStatus = async () => {
    try {
      await toggleQuestionStatus(question._id, !question.isActive);
      toast.success(
        `Question ${!question.isActive ? 'activated' : 'deactivated'} successfully`,
        {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#FFFFFF',
            borderRadius: '8px',
          },
          icon: <CheckCircleIcon className="h-5 w-5" />,
        }
      );
    } catch (error) {
      toast.error(
        `Failed to ${!question.isActive ? 'activate' : 'deactivate'} question. Please try again.`,
        { duration: 3000 }
      );
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150">
      {!isExpanded ? (
        /* Minimized Question Card - Single Line */
        <div 
          className="px-4 py-2.5 cursor-pointer"
          onClick={() => toggleQuestionExpanded(question._id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'}`}>
                  {question.difficulty}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {question.marks} marks
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium
                  ${question.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {question.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {/* Question Text */}
              <div className="flex-1 min-w-0 px-2">
                <span className="text-sm text-gray-900 truncate block">
                  {question.question.text}
                </span>
              </div>
              
              {/* Subject & Chapter Info */}
              <div className="text-sm text-gray-600 flex-shrink-0">
                <span className="font-medium text-blue-600">{question.subject}</span>
                <span className="mx-1">•</span>
                <span>{question.chapter}</span>
                <span className="ml-3 text-xs">{question.questionType}</span>
                <span className="ml-3 text-xs">Class: {question.class ? question.class.replace('class_', '') : 'N/A'}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <Link
                href={`/admin/questions/edit/${question._id}`}
                className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Edit
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStatus();
                }}
                disabled={togglingStatus === question._id}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors
                  ${question.isActive 
                    ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'}
                  ${togglingStatus === question._id ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {togglingStatus === question._id ? 'Updating...' : (question.isActive ? 'Deactivate' : 'Activate')}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className={`px-3 py-1 text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 transition-colors ${!isSuperAdmin && 'opacity-50 cursor-not-allowed'}`}
                disabled={!isSuperAdmin}
                title={!isSuperAdmin ? 'Only superadmins can delete questions' : ''}
              >
                Delete
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleQuestionExpanded(question._id);
                }}
                className="ml-2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Expanded Question Card */
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Header with Action Buttons */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'}`}>
                {question.difficulty}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {question.marks} marks
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${question.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {question.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-gray-600 ml-2">
                {typeof question.author === 'string' 
                  ? question.author 
                  : question.author?.username || question.author?.name || 'Unknown Author'}
                <span className="mx-1">•</span>
                {new Date(question.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
                <Link
                  href={`/admin/questions/edit/${question._id}`}
                  className="px-3 py-1 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Edit
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus();
                  }}
                  disabled={togglingStatus === question._id}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors
                    ${question.isActive 
                      ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                      : 'text-green-700 bg-green-100 hover:bg-green-200'}
                    ${togglingStatus === question._id ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {togglingStatus === question._id ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {question.isActive ? 'Deactivating...' : 'Activating...'}
                    </span>
                  ) : (
                    question.isActive ? 'Deactivate' : 'Activate'
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className={`px-3 py-1 text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors ${!isSuperAdmin && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!isSuperAdmin}
                  title={!isSuperAdmin ? 'Only superadmins can delete questions' : ''}
                >
                  Delete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleQuestionExpanded(question._id);
                  }}
                  className="ml-2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <ChevronUpIcon className="h-4 w-4" />
                </button>
            </div>
          </div>
          
          {/* Expanded Content - Two Column Layout */}
          <div className="flex">
            {/* Left Column - Question Content */}
            <div className="flex-1 p-6 border-r border-gray-200">
              {/* Question Text/Image */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3 whitespace-pre-wrap">
                  {question.question.text}
                </h3>
                {question.question.image?.url && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                    <div className="relative aspect-[16/9] w-full">
                      <Image 
                        src={question.question.image.url}
                        alt="Question"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false}
                        className="object-contain bg-gray-50"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.dataset.fallback) {
                            img.dataset.fallback = 'true';
                            img.src = '/placeholder-image.png';
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              {question.questionType !== 'numerical' && question.options && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Options:</h4>
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border flex items-start gap-3 ${
                          question.correctOptions?.includes(index)
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-300 text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{option.text}</p>
                          {option.image?.url && (
                            <div className="mt-2 rounded overflow-hidden border border-gray-200 max-w-xs">
                              <div className="relative aspect-video">
                                <Image 
                                  src={option.image.url}
                                  alt={`Option ${String.fromCharCode(65 + index)}`}
                                  fill
                                  className="object-contain bg-gray-50"
                                  sizes="(max-width: 768px) 100vw, 300px"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        {question.correctOptions?.includes(index) && (
                          <div className="text-green-600 text-xs font-medium">✓ Correct</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Numerical Answer */}
              {question.questionType === 'numerical' && question.numericalAnswer && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">Numerical Answer</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Exact Value:</span> {question.numericalAnswer.exactValue} {question.numericalAnswer.unit}</div>
                    <div><span className="font-medium">Range:</span> {question.numericalAnswer.range.min} - {question.numericalAnswer.range.max}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Question Details Panel */}
            <div className="w-80 bg-gray-50 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Question Details</h3>
              
              <div className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-600">Author:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {typeof question.author === 'string' 
                      ? question.author 
                      : question.author?.username || question.author?.name || 'Unknown Author'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Added On:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(question.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Subject:</dt>
                  <dd className="text-sm font-medium text-blue-600">{question.subject}</dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Chapter:</dt>
                  <dd className="text-sm font-medium text-gray-900">{question.chapter}</dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Class:</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {question.class ? (question.class === 'none' ? 'N/A' : question.class.replace('class_', '')) : 'N/A'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Type:</dt>
                  <dd className="text-sm font-medium text-gray-900">{question.questionType}</dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Language:</dt>
                  <dd className="text-sm font-medium text-gray-900">{question.language}</dd>
                </div>
                
                <div>
                  <dt className="text-sm text-gray-600">Level:</dt>
                  <dd className="text-sm font-medium text-gray-900">{question.languageLevel}</dd>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Times Attempted:</span>
                    <span className="font-medium">{question.statistics?.totalAttempts || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium">
                      {question.statistics?.totalAttempts > 0 
                        ? Math.round((question.statistics.correctAttempts / question.statistics.totalAttempts) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg. Time:</span>
                    <span className="font-medium">{question.statistics?.averageTime || 0}s</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className={`px-3 py-2 rounded-lg ${
                  question.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  <div className="text-sm font-medium">
                    {question.isVerified ? 'Verified' : 'Pending Verification'}
                  </div>
                  <div className="text-xs">
                    {question.isVerified ? 'This question has been verified' : 'Awaiting verification'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};