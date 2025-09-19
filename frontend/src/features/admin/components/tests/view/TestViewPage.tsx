"use client";

import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import TestViewContainer, { TestViewContextProps } from './TestViewContainer';
import TestViewHeader from './TestViewHeader';
import TestViewQuestions from './TestViewQuestions';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import ErrorMessage from '../../analytics/ErrorMessage';

const TestViewPageContent: React.FC<TestViewContextProps> = ({
  test,
  testId,
  questionDetails,
  loading,
  fetchingQuestions,
  isDeleting,
  isUpdatingStatus,
  error,
  showDeleteConfirm,
  setShowDeleteConfirm,
  showStatusDropdown,
  setShowStatusDropdown,
  handleDeleteTest,
  handleUpdateStatus,
  retryLoadTest,
  retryLoadQuestions,
  statusDropdownRef,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage message={error} onRetry={retryLoadTest} />
    );
  }

  if (!test) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Test not found</h3>
          <p className="text-gray-600">The test you're looking for doesn't exist or has been deleted.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <TestViewHeader
        test={test}
        isUpdatingStatus={isUpdatingStatus}
        showStatusDropdown={showStatusDropdown}
        onStatusDropdownChange={setShowStatusDropdown}
        onStatusUpdate={handleUpdateStatus}
        onDeleteConfirm={() => setShowDeleteConfirm(true)}
        statusDropdownRef={statusDropdownRef}
      />

      {/* Main Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Test Instructions */}
          {test.instructions && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Instructions</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{test.instructions}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Tags */}
          {test.tags && test.tags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {test.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Marking Scheme */}
          {test.markingScheme && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Marking Scheme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {test.markingScheme.correct !== undefined && (
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        +{test.markingScheme.correct}
                      </div>
                      <div className="text-sm text-green-600">Correct Answer</div>
                    </div>
                  )}
                  
                  {test.markingScheme.incorrect !== undefined && (
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-700">
                        {test.markingScheme.incorrect}
                      </div>
                      <div className="text-sm text-red-600">Incorrect Answer</div>
                    </div>
                  )}
                  
                  {test.markingScheme.unattempted !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-700">
                        {test.markingScheme.unattempted}
                      </div>
                      <div className="text-sm text-gray-600">Unattempted</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions */}
          <TestViewQuestions
            questions={test.questions}
            questionDetails={questionDetails}
            fetchingQuestions={fetchingQuestions}
            onRetry={retryLoadQuestions}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Test
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "<strong>{test.title}</strong>"? 
              This action cannot be undone and will permanently remove the test and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTest}
              disabled={isDeleting}
              className="bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500 border border-red-300"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Test
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const TestViewPage: React.FC = () => {
  return (
    <TestViewContainer>
      {(props) => <TestViewPageContent {...props} />}
    </TestViewContainer>
  );
};

export default TestViewPage;