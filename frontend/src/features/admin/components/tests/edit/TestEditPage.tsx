"use client";

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import TestEditContainer, { TestEditContextProps } from './TestEditContainer';
import TestEditHeader from './TestEditHeader';
import TestEditTabs from './TestEditTabs';
import RevisionHistoryPanel from './RevisionHistoryPanel';
import { TestDetailsForm } from '../TestDetailsForm';
import TestQuestionFilters from '../create/QuestionFilters';
import QuestionListView from '../create/QuestionListView';
import SelectedQuestionsPanel from '../create/SelectedQuestionsPanel';
import { Card, CardContent } from '@/shared/components/ui/card';
import ErrorMessage from '../../analytics/ErrorMessage';

const TestEditPageContent: React.FC<TestEditContextProps> = ({
  testId,
  testDetails,
  handleDetailChange,
  handleNestedDetailChange,
  questions,
  filteredQuestions,
  selectedQuestions,
  loading,
  error,
  filters,
  setFilters,
  availableOptions,
  activeTab,
  setActiveTab,
  expandedQuestions,
  currentPage,
  setCurrentPage,
  questionsPerPage,
  setQuestionsPerPage,
  showMoreVisible,
  revisionHistory,
  loadingHistory,
  selectedQuestionsMetrics,
  paginatedAndFilteredQuestions,
  handleQuestionSelect,
  handleToggleExpand,
  handleExpandAll,
  handleCollapseAll,
  handleResetFilters,
  handleShowMore,
  handleUpdateTest,
  handleLoadRevisionHistory,
  retryLoadQuestions,
  retryLoadTest,
  isSubmitting,
  testLoading,
  testError,
}) => {
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  if (testLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (testError) {
    return (
      <ErrorMessage message={testError} onRetry={retryLoadTest} />
    );
  }

  const handleViewRevisionHistory = () => {
    setShowRevisionHistory(true);
    handleLoadRevisionHistory();
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <TestEditHeader
        testId={testId}
        testDetails={testDetails}
        isSubmitting={isSubmitting}
        onSave={handleUpdateTest}
        onViewRevisionHistory={handleViewRevisionHistory}
      />

      {/* Main Content */}
      <div className="p-6">
        <TestEditTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedQuestionsCount={selectedQuestions.length}
        >
          {{
            details: (
              <Card>
                <CardContent className="p-6">
                  <TestDetailsForm 
                    testDetails={testDetails}
                    onDetailChange={handleDetailChange}
                    onNestedDetailChange={handleNestedDetailChange}
                  />
                </CardContent>
              </Card>
            ),
            
            questions: (
              <div className="space-y-6">
                {/* Question Filters */}
                                    <TestQuestionFilters
                  filters={filters}
                  availableOptions={availableOptions}
                  onFilterChange={setFilters}
                  onResetFilters={handleResetFilters}
                  totalCount={questions.length}
                  filteredCount={paginatedAndFilteredQuestions.totalFilteredCount}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Question List */}
                  <div className="lg:col-span-2">
                    <QuestionListView
                      questions={filteredQuestions}
                      selectedQuestions={selectedQuestions}
                      expandedQuestions={expandedQuestions}
                      loading={loading}
                      error={error}
                      onSelectQuestion={handleQuestionSelect}
                      onToggleExpand={handleToggleExpand}
                      onExpandAll={handleExpandAll}
                      onCollapseAll={handleCollapseAll}
                      onRetry={retryLoadQuestions}
                    />

                    {/* Show More Button */}
                    {showMoreVisible && (
                      <div className="text-center mt-6">
                        <button 
                          className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
                          onClick={handleShowMore}
                        >
                          Show More Questions
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Selected Questions Panel */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-6">
                      <SelectedQuestionsPanel
                        selectedQuestions={selectedQuestions}
                        questions={questions}
                        metrics={selectedQuestionsMetrics}
                        onRemoveQuestion={handleQuestionSelect}
                        onClearAll={() => {
                          selectedQuestions.forEach(id => handleQuestionSelect(id));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ),
            
            analytics: (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📊</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Test Analytics
                    </h3>
                    <p className="text-gray-600">
                      View detailed analytics and performance metrics for this test.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Coming soon...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ),
            
            settings: (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">⚙️</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Advanced Settings
                    </h3>
                    <p className="text-gray-600">
                      Configure advanced test settings, permissions, and publishing options.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Coming soon...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          }}
        </TestEditTabs>
      </div>

      {/* Revision History Dialog */}
      <RevisionHistoryPanel
        isOpen={showRevisionHistory}
        onClose={() => setShowRevisionHistory(false)}
        revisionHistory={revisionHistory}
        loading={loadingHistory}
        onLoadHistory={handleLoadRevisionHistory}
      />
    </div>
  );
};

const TestEditPage: React.FC = () => {
  return (
    <TestEditContainer>
      {(props) => <TestEditPageContent {...props} />}
    </TestEditContainer>
  );
};

export default TestEditPage;