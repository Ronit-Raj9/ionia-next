"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Check, 
  ChevronDown,
  Loader2,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Target
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/shared/components/ui/dropdown-menu';

interface Test {
  _id: string;
  title: string;
  testCategory: 'PYQ' | 'Platform' | 'UserCustom'; 
  description?: string;
  subject: string;
  examType: string;
  class: string;
  difficulty: string;
  status: 'draft' | 'published' | 'archived';
  duration: number;
  year?: number;
  questions: any[];
  createdAt: string;
  updatedAt: string;
  attemptsAllowed?: number;
  solutionsVisibility?: string;
  tags?: string[];
}

interface TestViewHeaderProps {
  test: Test;
  isUpdatingStatus: boolean;
  showStatusDropdown: boolean;
  onStatusDropdownChange: (show: boolean) => void;
  onStatusUpdate: (status: 'draft' | 'published' | 'archived') => void;
  onDeleteConfirm: () => void;
  statusDropdownRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

const TestViewHeader: React.FC<TestViewHeaderProps> = ({
  test,
  isUpdatingStatus,
  showStatusDropdown,
  onStatusDropdownChange,
  onStatusUpdate,
  onDeleteConfirm,
  statusDropdownRef,
  className = ''
}) => {
  const getStatusBadge = () => {
    switch (test.status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Published</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
      case 'archived':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Archived</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{test.status}</Badge>;
    }
  };

  const getCategoryBadge = () => {
    switch (test.testCategory) {
      case 'PYQ':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Previous Year Question</Badge>;
      case 'Platform':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Platform Test</Badge>;
      case 'UserCustom':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Custom Test</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{test.testCategory}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const totalMarks = test.questions?.reduce((sum, q) => {
    if (typeof q === 'object' && q.marks) {
      return sum + q.marks;
    }
    return sum + 1; // Default to 1 if marks not available
  }, 0) || 0;

  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-6 ${className}`}>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Link href="/admin/tests">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Back to Tests
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <DropdownMenu open={showStatusDropdown} onOpenChange={onStatusDropdownChange}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isUpdatingStatus}
                    className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Change Status
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => onStatusUpdate('draft')}
                    disabled={test.status === 'draft'}
                  >
                    Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onStatusUpdate('published')}
                    disabled={test.status === 'published'}
                  >
                    Published
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onStatusUpdate('archived')}
                    disabled={test.status === 'archived'}
                  >
                    Archived
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link href={`/admin/tests/edit/${test._id}`}>
              <Button size="sm" className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={onDeleteConfirm}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Test Title and Badges */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getCategoryBadge()}
            </div>
          </div>

          {test.description && (
            <p className="text-gray-600 max-w-3xl">{test.description}</p>
          )}
        </div>

        {/* Test Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">{test.subject}</p>
              <p className="text-gray-500">Subject</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-green-500" />
            <div>
              <p className="font-medium text-gray-900">{test.examType}</p>
              <p className="text-gray-500">Exam Type</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <p className="font-medium text-gray-900">{test.class}</p>
              <p className="text-gray-500">Class</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-orange-500" />
            <div>
              <p className="font-medium text-gray-900">{test.duration} min</p>
              <p className="text-gray-500">Duration</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-red-500" />
            <div>
              <p className="font-medium text-gray-900">{test.questions?.length || 0}</p>
              <p className="text-gray-500">Questions</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-indigo-500" />
            <div>
              <p className="font-medium text-gray-900">{totalMarks}</p>
              <p className="text-gray-500">Total Marks</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Created: {formatDate(test.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Updated: {formatDate(test.updatedAt)}</span>
          </div>

          {test.difficulty && (
            <div className="flex items-center gap-1">
              <span>Difficulty: </span>
              <Badge 
                className={`text-xs ${
                  test.difficulty === 'easy' ? 'bg-green-100 text-green-700 border-green-200' :
                  test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  'bg-red-100 text-red-700 border-red-200'
                }`}
              >
                {test.difficulty}
              </Badge>
            </div>
          )}

          {test.year && (
            <div className="flex items-center gap-1">
              <span>Year: {test.year}</span>
            </div>
          )}

          {test.attemptsAllowed && (
            <div className="flex items-center gap-1">
              <span>Max Attempts: {test.attemptsAllowed}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestViewHeader;