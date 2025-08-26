"use client";

import React from 'react';
import { ArrowLeft, Save, Loader2, Eye, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { TestDetails } from '../types';

interface TestEditHeaderProps {
  testId: string;
  testDetails: TestDetails;
  isSubmitting: boolean;
  onSave: () => void;
  onViewRevisionHistory: () => void;
  className?: string;
}

const TestEditHeader: React.FC<TestEditHeaderProps> = ({
  testId,
  testDetails,
  isSubmitting,
  onSave,
  onViewRevisionHistory,
  className = ''
}) => {
  const getStatusBadge = () => {
    switch (testDetails.status) {
      case 'published':
        return <Badge className="bg-green-600">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge variant="secondary">{testDetails.status}</Badge>;
    }
  };

  const getCategoryBadge = () => {
    switch (testDetails.testCategory) {
      case 'PYQ':
        return <Badge className="bg-blue-600">Previous Year Question</Badge>;
      case 'Platform':
        return <Badge className="bg-purple-600">Platform Test</Badge>;
      case 'UserCustom':
        return <Badge className="bg-orange-600">Custom Test</Badge>;
      default:
        return <Badge variant="outline">{testDetails.testCategory}</Badge>;
    }
  };

  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tests">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Tests
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Edit Test: {testDetails.title || 'Untitled Test'}
            </h1>
            {getStatusBadge()}
            {getCategoryBadge()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewRevisionHistory}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          
          <Link href={`/admin/tests/view/${testId}`}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </Link>
          
          <Button
            onClick={onSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Test Meta Information */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
        {testDetails.subject && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Subject:</span>
            <span>{testDetails.subject}</span>
          </div>
        )}
        
        {testDetails.examType && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Exam:</span>
            <span>{testDetails.examType}</span>
          </div>
        )}
        
        {testDetails.class && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Class:</span>
            <span>{testDetails.class}</span>
          </div>
        )}
        
        {testDetails.difficulty && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Difficulty:</span>
            <span className="capitalize">{testDetails.difficulty}</span>
          </div>
        )}
        
        {testDetails.duration && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Duration:</span>
            <span>{testDetails.duration} minutes</span>
          </div>
        )}
        
        {testDetails.year && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Year:</span>
            <span>{testDetails.year}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestEditHeader;