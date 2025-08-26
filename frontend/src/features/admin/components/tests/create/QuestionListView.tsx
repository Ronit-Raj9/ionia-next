"use client";

import React from 'react';
import { ChevronDown, ChevronUp, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Question } from '../questions/types';
import LoadingSpinner from '../../analytics/LoadingSpinner';
import ErrorMessage from '../../analytics/ErrorMessage';

interface QuestionListViewProps {
  questions: Question[];
  selectedQuestions: string[];
  expandedQuestions: Set<string>;
  loading: boolean;
  error: string;
  onSelectQuestion: (questionId: string) => void;
  onToggleExpand: (questionId: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRetry: () => void;
  className?: string;
}

const QuestionListView: React.FC<QuestionListViewProps> = ({
  questions,
  selectedQuestions,
  expandedQuestions,
  loading,
  error,
  onSelectQuestion,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onRetry,
  className = ''
}) => {
  if (loading && questions.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <LoadingSpinner message="Loading questions..." />
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className={className}>
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-600">
            Try adjusting your filters or add some questions to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatQuestionText = (question: Question['question']) => {
    if (typeof question === 'string') {
      return question;
    }
    return question?.text || 'No question text available';
  };

  const getQuestionImage = (question: Question) => {
    if (typeof question.question === 'object' && question.question?.image?.url) {
      return question.question.image.url;
    }
    if (question.image?.url) {
      return question.image.url;
    }
    return null;
  };

  const formatOptions = (question: Question) => {
    if (!question.options || question.options.length === 0) {
      return [];
    }

    return question.options.map((option, index) => {
      if (typeof option === 'string') {
        return { text: option, image: null };
      }
      return {
        text: option.text || `Option ${index + 1}`,
        image: option.image?.url || null
      };
    });
  };

  const getCorrectAnswer = (question: Question) => {
    if (question.questionType === 'multiple' && question.correctOptions) {
      return question.correctOptions.map(idx => 
        String.fromCharCode(65 + idx)
      ).join(', ');
    }
    if (question.correctOption !== undefined) {
      return String.fromCharCode(65 + question.correctOption);
    }
    return 'N/A';
  };

  return (
    <div className={className}>
      {/* Bulk Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {selectedQuestions.length} of {questions.length} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandedQuestions.size > 0 ? onCollapseAll : onExpandAll}
            className="flex items-center gap-1"
          >
            {expandedQuestions.size > 0 ? (
              <>
                <EyeOff className="h-3 w-3" />
                Collapse All
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Expand All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const isSelected = selectedQuestions.includes(question._id);
          const isExpanded = expandedQuestions.has(question._id);
          const questionText = formatQuestionText(question.question);
          const questionImage = getQuestionImage(question);
          const options = formatOptions(question);
          const correctAnswer = getCorrectAnswer(question);

          return (
            <Card 
              key={question._id} 
              className={`transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CardContent className="p-4">
                {/* Question Header */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectQuestion(question._id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Q{index + 1}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {question.marks} mark{question.marks !== 1 ? 's' : ''}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.questionType}
                          </Badge>
                          {question.isVerified && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {questionText}
                        </p>
                        
                        {/* Question Meta */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                          {question.subject && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {question.subject}
                            </span>
                          )}
                          {question.examType && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                              {question.examType}
                            </span>
                          )}
                          {question.difficulty && (
                            <span className={`px-2 py-1 rounded ${
                              question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {question.difficulty}
                            </span>
                          )}
                          {question.class && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {question.class}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleExpand(question._id)}
                        className="flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-4">
                      {/* Full Question */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Question:
                        </h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {questionText}
                        </p>
                        {questionImage && (
                          <div className="mt-2">
                            <img
                              src={questionImage}
                              alt="Question"
                              className="max-w-full h-auto rounded border"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      {options.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Options:
                          </h4>
                          <div className="space-y-2">
                            {options.map((option, optIndex) => (
                              <div 
                                key={optIndex} 
                                className="flex items-start gap-2 p-2 rounded bg-gray-50"
                              >
                                <span className="text-sm font-medium text-gray-600 mt-0.5">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700">
                                    {option.text}
                                  </p>
                                  {option.image && (
                                    <img
                                      src={option.image}
                                      alt={`Option ${optIndex + 1}`}
                                      className="mt-1 max-w-full h-auto rounded border"
                                      style={{ maxHeight: '100px' }}
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Answer */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          Correct Answer:
                        </h4>
                        <p className="text-sm text-green-700 font-medium">
                          {correctAnswer}
                        </p>
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        {question.chapter && (
                          <div>
                            <span className="font-medium text-gray-600">Chapter:</span>
                            <p className="text-gray-700">{question.chapter}</p>
                          </div>
                        )}
                        {question.section && (
                          <div>
                            <span className="font-medium text-gray-600">Section:</span>
                            <p className="text-gray-700">{question.section}</p>
                          </div>
                        )}
                        {question.year && (
                          <div>
                            <span className="font-medium text-gray-600">Year:</span>
                            <p className="text-gray-700">{question.year}</p>
                          </div>
                        )}
                        {question.negativeMarks !== undefined && (
                          <div>
                            <span className="font-medium text-gray-600">Negative Marks:</span>
                            <p className="text-gray-700">{question.negativeMarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionListView;