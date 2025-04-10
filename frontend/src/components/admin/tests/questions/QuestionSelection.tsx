import { useState } from "react";
import { ChevronDown, Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuestionCard } from "./QuestionCard";
import { QuestionFilter } from "./QuestionFilter";
import { QuestionsPagination } from "./QuestionsPagination";
import { SelectedQuestionsMetrics } from "./SelectedQuestionsMetrics";
import { Question, FilterState, AvailableOptions, SelectedQuestionsMetrics as SelectedQuestionsMetricsType } from "./types";

interface QuestionSelectionProps {
  questions: Question[];
  filteredQuestions: Question[];
  totalFilteredCount: number;
  selectedQuestions: string[];
  expandedQuestions: Set<string>;
  filters: FilterState;
  availableOptions: AvailableOptions;
  loading: boolean;
  error: string;
  currentPage: number;
  questionsPerPage: number;
  selectedQuestionsMetrics: SelectedQuestionsMetricsType;
  onSelectQuestion: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
}

export function QuestionSelection({
  questions,
  filteredQuestions,
  totalFilteredCount,
  selectedQuestions,
  expandedQuestions,
  filters,
  availableOptions,
  loading,
  error,
  currentPage,
  questionsPerPage,
  selectedQuestionsMetrics,
  onSelectQuestion,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onSubmit,
  isSubmitting = false
}: QuestionSelectionProps) {

  // All questions are expanded if every filtered question is in the expanded set
  const allExpanded = filteredQuestions.length > 0 && 
    filteredQuestions.every(q => expandedQuestions.has(q._id));

  return (
    <div className="min-h-screen">
      {/* Sticky Summary and Submit Bar */}
      {selectedQuestions.length > 0 && (
        <div className="sticky top-0 z-10 bg-white border-b border-green-100 shadow-sm mb-6 py-2 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-green-700">{selectedQuestions.length}</span>
                  <span className="text-gray-600 text-sm">questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-green-700">{selectedQuestionsMetrics.totalMarks}</span>
                  <span className="text-gray-600 text-sm">marks</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedQuestionsMetrics.difficultyCounts.easy && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">
                      {selectedQuestionsMetrics.difficultyCounts.easy} easy
                    </span>
                  )}
                  {selectedQuestionsMetrics.difficultyCounts.medium && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                      {selectedQuestionsMetrics.difficultyCounts.medium} medium
                    </span>
                  )}
                  {selectedQuestionsMetrics.difficultyCounts.hard && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs">
                      {selectedQuestionsMetrics.difficultyCounts.hard} hard
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Select Questions</CardTitle>
          <CardDescription>
            Choose the questions to include in this test. 
            {filters.searchTerm || 
             filters.examType.length > 0 || 
             filters.year.length > 0 || 
             filters.subject.length > 0 || 
             filters.chapter.length > 0 || 
             filters.difficulty.length > 0 ? 
               `Found ${totalFilteredCount} matching questions.` : 
               `Showing all ${questions.length} available questions.`}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Action Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search and Filter Controls */}
        <div className="flex w-full md:w-auto gap-3 flex-1">
          {/* Desktop Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={filters.searchTerm}
              onChange={(e) => onFilterChange({ ...filters, searchTerm: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Filter Control */}
          <div className="w-full md:w-48">
            <QuestionFilter
              filters={filters}
              availableOptions={availableOptions}
              onFilterChange={onFilterChange}
              onResetFilters={onResetFilters}
              questions={questions}
            />
          </div>
        </div>

        {/* Expand/Collapse Control */}
        <Button
          variant="outline"
          size="sm"
          onClick={allExpanded ? onCollapseAll : onExpandAll}
          className="text-sm whitespace-nowrap"
        >
          <ChevronDown className={`h-4 w-4 mr-2 ${allExpanded ? 'transform rotate-180' : ''}`} />
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
            <p className="text-green-600 mt-2">Loading questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-green-600">No questions found matching your criteria.</p>
            {(filters.searchTerm || filters.examType.length > 0 || filters.subject.length > 0 || filters.chapter.length > 0 || filters.difficulty.length > 0 || filters.year.length > 0) && (
              <Button
                onClick={onResetFilters}
                className="mt-2 text-green-700 hover:text-green-800 underline"
                variant="ghost"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              isSelected={selectedQuestions.includes(question._id)}
              isExpanded={expandedQuestions.has(question._id)}
              onSelect={onSelectQuestion}
              onToggleExpand={onToggleExpand}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <QuestionsPagination
        currentPage={currentPage}
        totalItems={totalFilteredCount}
        itemsPerPage={questionsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  );
} 