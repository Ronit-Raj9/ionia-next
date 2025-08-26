"use client";

import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  AlertCircle,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import LoadingSpinner from '../../analytics/LoadingSpinner';

interface Question {
  _id: string;
  question: {
    text: string;
    image?: { url?: string; publicId?: string };
  } | string;
  image?: { url?: string; publicId?: string };
  questionType?: 'single' | 'multiple' | 'numerical';
  options?: Array<{ text?: string; image?: { url?: string; publicId?: string } } | string>;
  correctOptions?: number[];
  correctOption?: number;
  marks: number;
  subject?: string;
  examType?: string;
  class?: string;
  difficulty?: string;
  year?: string;
  chapter?: string;
  section?: string;
  negativeMarks?: number;
  isVerified?: boolean;
  isActive?: boolean;
}

interface TestViewQuestionsProps {
  questions: (Question | string)[];
  questionDetails: Record<string, Question>;
  fetchingQuestions: boolean;
  onRetry?: () => void;
  className?: string;
}

const TestViewQuestions: React.FC<TestViewQuestionsProps> = ({
  questions,
  questionDetails,
  fetchingQuestions,
  onRetry,
  className = ''
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [showAnswers, setShowAnswers] = useState<boolean>(false);

  const toggleExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    questions.forEach((q, index) => {
      if (typeof q === 'string') {
        allIds.add(q);
      } else {
        allIds.add(q._id);
      }
    });
    setExpandedQuestions(allIds);
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

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

  const getQuestionData = (q: Question | string, index: number): Question | null => {
    if (typeof q === 'string') {
      return questionDetails[q] || null;
    }
    // If q is already a Question object, return it directly
    return q as Question;
  };

  const getTotalMarks = () => {
    return questions.reduce((sum, q, index) => {
      const questionData = getQuestionData(q, index);
      return sum + (questionData?.marks || 1);
    }, 0);
  };

  const getQuestionStats = () => {
    const stats = {
      total: questions.length,
      verified: 0,
      unverified: 0,
      byDifficulty: { easy: 0, medium: 0, hard: 0 },
      byType: { single: 0, multiple: 0, numerical: 0 }
    };

    questions.forEach((q, index) => {
      const questionData = getQuestionData(q, index);
      if (questionData) {
        if (questionData.isVerified) stats.verified++;
        else stats.unverified++;
        
        if (questionData.difficulty) {
          const diff = questionData.difficulty as 'easy' | 'medium' | 'hard';
          if (stats.byDifficulty[diff] !== undefined) {
            stats.byDifficulty[diff]++;
          }
        }
        
        if (questionData.questionType) {
          const type = questionData.questionType as 'single' | 'multiple' | 'numerical';
          if (stats.byType[type] !== undefined) {
            stats.byType[type]++;
          }
        }
      }
    });

    return stats;
  };

  const stats = getQuestionStats();
  
  // Calculate loading success/failure stats
  const loadedQuestions = Object.keys(questionDetails).length;
  const failedQuestions = questions.length - loadedQuestions;
  const loadingSuccess = loadedQuestions > 0 ? (loadedQuestions / questions.length) * 100 : 0;

  if (fetchingQuestions) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <LoadingSpinner message={`Loading ${questions.length} question details...`} />
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Fetching detailed information for each question...</p>
            <p className="mt-1">This may take a moment for tests with many questions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Questions ({questions.length})
            <Badge className="bg-gray-100 text-gray-800 border-gray-200">{getTotalMarks()} marks</Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {showAnswers ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Answers
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Answers
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={expandedQuestions.size > 0 ? collapseAll : expandAll}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {expandedQuestions.size > 0 ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Expand All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Question Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="font-semibold text-blue-700">{stats.total}</div>
            <div className="text-blue-600">Total</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="font-semibold text-green-700">{loadedQuestions}</div>
            <div className="text-green-600">Loaded</div>
          </div>
          {failedQuestions > 0 && (
            <div className="text-center p-2 bg-red-50 rounded">
              <div className="font-semibold text-red-700">{failedQuestions}</div>
              <div className="text-red-600">Failed</div>
            </div>
          )}
          <div className="text-center p-2 bg-yellow-50 rounded">
            <div className="font-semibold text-yellow-700">{stats.unverified}</div>
            <div className="text-yellow-600">Unverified</div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <div className="font-semibold text-purple-700">{stats.byType.single}</div>
            <div className="text-purple-600">Single</div>
          </div>
          <div className="text-center p-2 bg-indigo-50 rounded">
            <div className="font-semibold text-indigo-700">{stats.byType.multiple}</div>
            <div className="text-indigo-600">Multiple</div>
          </div>
        </div>
        
        {/* Loading Status */}
        {failedQuestions > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-yellow-800">
                <p><strong>Warning:</strong> {failedQuestions} out of {questions.length} questions failed to load.</p>
                <p className="mt-1">Success rate: {loadingSuccess.toFixed(1)}%</p>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded hover:bg-yellow-200 transition-colors border border-yellow-300"
                >
                  Retry Loading
                </button>
              )}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600">This test doesn't have any questions yet.</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {questions.map((q, index) => {
                const questionData = getQuestionData(q, index);
                const questionId = typeof q === 'string' ? q : q._id;
                const isExpanded = expandedQuestions.has(questionId);

                if (!questionData) {
                  return (
                    <Card key={questionId} className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertCircle className="h-5 w-5" />
                          <span>Question {index + 1}: Failed to load question data (ID: {questionId})</span>
                        </div>
                        <div className="mt-2 text-sm text-red-600">
                          <p>This question could not be loaded. Please check the API endpoint or try refreshing the page.</p>
                          {onRetry && (
                            <button
                              onClick={onRetry}
                              className="mt-2 px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors border border-red-300"
                            >
                              Retry Loading
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                const questionText = formatQuestionText(questionData.question);
                const questionImage = getQuestionImage(questionData);
                const options = formatOptions(questionData);
                const correctAnswer = getCorrectAnswer(questionData);

                return (
                  <Card key={questionId} className="border-gray-200">
                    <CardContent className="p-4">
                      {/* Question Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Q{index + 1}</span>
                          <Badge className="text-xs bg-gray-100 text-gray-800 border-gray-200">
                            {questionData.marks} mark{questionData.marks !== 1 ? 's' : ''}
                          </Badge>
                          <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                            {questionData.questionType}
                          </Badge>
                          {questionData.isVerified && (
                            <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(questionId)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Question Text */}
                      <div className="mb-3">
                        <p className="text-gray-700 text-sm">
                          {isExpanded ? questionText : `${questionText.substring(0, 150)}${questionText.length > 150 ? '...' : ''}`}
                        </p>
                        {questionImage && isExpanded && (
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

                      {/* Question Meta */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                        {questionData.subject && (
                          <span className="bg-gray-100 px-2 py-1 rounded">{questionData.subject}</span>
                        )}
                        {questionData.difficulty && (
                          <span className={`px-2 py-1 rounded ${
                            questionData.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            questionData.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {questionData.difficulty}
                          </span>
                        )}
                        {questionData.chapter && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{questionData.chapter}</span>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                          {/* Options */}
                          {options.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Options:</h4>
                              <div className="space-y-2">
                                {options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-start gap-2 p-2 rounded bg-gray-50">
                                    <span className="text-sm font-medium text-gray-600 mt-0.5">
                                      {String.fromCharCode(65 + optIndex)}.
                                    </span>
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-700">{option.text}</p>
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

                          {/* Answer (if shown) */}
                          {showAnswers && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Correct Answer:</h4>
                              <p className="text-sm text-green-700 font-medium">{correctAnswer}</p>
                            </div>
                          )}

                          {/* Additional Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            {questionData.chapter && (
                              <div>
                                <span className="font-medium text-gray-600">Chapter:</span>
                                <p className="text-gray-700">{questionData.chapter}</p>
                              </div>
                            )}
                            {questionData.section && (
                              <div>
                                <span className="font-medium text-gray-600">Section:</span>
                                <p className="text-gray-700">{questionData.section}</p>
                              </div>
                            )}
                            {questionData.year && (
                              <div>
                                <span className="font-medium text-gray-600">Year:</span>
                                <p className="text-gray-700">{questionData.year}</p>
                              </div>
                            )}
                            {questionData.negativeMarks !== undefined && (
                              <div>
                                <span className="font-medium text-gray-600">Negative Marks:</span>
                                <p className="text-gray-700">{questionData.negativeMarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TestViewQuestions;