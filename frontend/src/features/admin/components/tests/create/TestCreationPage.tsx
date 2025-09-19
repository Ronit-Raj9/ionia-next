"use client";

import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import TestCreationContainer, { TestCreationContextProps } from './TestCreationContainer';
import { TestDetailsForm } from '../TestDetailsForm';
import { TestCreationStepper } from '../TestCreationStepper';
import TestQuestionFilters from './QuestionFilters';
import QuestionListView from './QuestionListView';
import SelectedQuestionsPanel from './SelectedQuestionsPanel';

const TestCreationPageContent: React.FC<TestCreationContextProps> = ({
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
  activeStep,
  setActiveStep,
  expandedQuestions,
  currentPage,
  setCurrentPage,
  questionsPerPage,
  setQuestionsPerPage,
  showMoreVisible,
  selectedQuestionsMetrics,
  paginatedAndFilteredQuestions,
  handleQuestionSelect,
  handleToggleExpand,
  handleExpandAll,
  handleCollapseAll,
  handleResetFilters,
  handleShowMore,
  handleCreateTest,
  retryLoadQuestions,
  isSubmitting,
}) => {
  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="border-green-200">
        <CardHeader className="bg-green-50 border-b border-green-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-green-800">Create New Test</CardTitle>
              <CardDescription>
                Create a new test by selecting questions and defining test parameters
              </CardDescription>
            </div>
            {activeStep === 2 && (
              <Button 
                onClick={handleCreateTest} 
                disabled={isSubmitting || selectedQuestions.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Create Test
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Test Creation Stepper */}
          <TestCreationStepper
            activeStep={activeStep}
            onStepClick={setActiveStep}
            testDetails={testDetails}
            selectedQuestionsCount={selectedQuestions.length}
          />

          {/* Step 1: Test Details Form */}
          <div className={activeStep === 1 ? 'block' : 'hidden'}>
            <TestDetailsForm 
              testDetails={testDetails}
              onDetailChange={handleDetailChange}
              onNestedDetailChange={handleNestedDetailChange}
            />
          </div>

          {/* Step 2: Question Selection */}
          <div className={activeStep === 2 ? 'block' : 'hidden'}>
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
                      <Button 
                        variant="outline" 
                        className="border-green-300 text-green-700 hover:bg-green-50"
                        onClick={handleShowMore}
                      >
                        Show More Questions
                      </Button>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TestCreationPage: React.FC = () => {
  return (
    <TestCreationContainer>
      {(props) => <TestCreationPageContent {...props} />}
    </TestCreationContainer>
  );
};

export default TestCreationPage;