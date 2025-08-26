"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  DocumentCheckIcon, 
  UserGroupIcon,
  ExclamationCircleIcon,
  EyeIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import type { TestItem, QuestionItem } from '../../types';

interface RecentItemsProps {
  title: string;
  items: TestItem[] | QuestionItem[];
  isLoading: boolean;
  error: string | null;
  type: 'tests' | 'questions';
  icon: React.ElementType;
  className?: string;
}

const RecentItems: React.FC<RecentItemsProps> = ({
  title,
  items,
  isLoading,
  error,
  type,
  icon: Icon,
  className = ''
}) => {
  const getItemUrl = (item: TestItem | QuestionItem, action: 'view' | 'edit') => {
    if (type === 'tests') {
      return action === 'view' 
        ? `/admin/tests/view/${item.id}` 
        : `/admin/tests/edit/${item.id}`;
    } else {
      return action === 'view' 
        ? `/admin/questions/${item.id}` 
        : `/admin/questions/edit/${item.id}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderTestItem = (test: TestItem, index: number) => (
    <motion.li 
      key={test.id} 
      className="py-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={test.title}>
            {test.title}
          </p>
          <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <DocumentCheckIcon className="h-3 w-3 mr-1" />
              {test.questions} questions
            </span>
            <span className="flex items-center">
              <UserGroupIcon className="h-3 w-3 mr-1" />
              {test.attempts} attempts
            </span>
            <span>
              Created {formatDate(test.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            href={getItemUrl(test, 'view')}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
            title="View test"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View
          </Link>
          <Link
            href={getItemUrl(test, 'edit')}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            title="Edit test"
          >
            <PencilSquareIcon className="h-3 w-3 mr-1" />
            Edit
          </Link>
        </div>
      </div>
    </motion.li>
  );

  const renderQuestionItem = (question: QuestionItem, index: number) => (
    <motion.li 
      key={question.id} 
      className="py-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={question.title}>
            {question.title}
          </p>
          <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <Icon className="h-3 w-3 mr-1" />
              {question.subject}
            </span>
            <span>
              Added {formatDate(question.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            href={getItemUrl(question, 'view')}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
            title="View question"
          >
            <EyeIcon className="h-3 w-3 mr-1" />
            View
          </Link>
          <Link
            href={getItemUrl(question, 'edit')}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            title="Edit question"
          >
            <PencilSquareIcon className="h-3 w-3 mr-1" />
            Edit
          </Link>
        </div>
      </div>
    </motion.li>
  );

  return (
    <div className={`bg-white shadow-sm rounded-xl ${className}`}>
      <div className="px-6 py-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Icon className="h-5 w-5 mr-2 text-gray-600" />
          {title}
        </h3>
        
        <div className="overflow-hidden">
          <div className="flow-root">
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : error || !items || items.length === 0 ? (
              <div className="text-center py-8">
                <ExclamationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {error ? 'Failed to load data' : `No ${type} available`}
                </p>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-gray-200">
                {items.map((item, index) => 
                  type === 'tests' 
                    ? renderTestItem(item as TestItem, index)
                    : renderQuestionItem(item as QuestionItem, index)
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentItems;