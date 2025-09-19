"use client";

import React from 'react';
import { CheckCircle, Target, BookOpen, BarChart3, X, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { SelectedQuestionsMetrics, Question } from '../questions/types';

interface SelectedQuestionsPanelProps {
  selectedQuestions: string[];
  questions: Question[];
  metrics: SelectedQuestionsMetrics;
  onRemoveQuestion: (questionId: string) => void;
  onClearAll: () => void;
  className?: string;
}

const SelectedQuestionsPanel: React.FC<SelectedQuestionsPanelProps> = ({
  selectedQuestions,
  questions,
  metrics,
  onRemoveQuestion,
  onClearAll,
  className = ''
}) => {
  const selectedQuestionObjects = questions.filter(q => selectedQuestions.includes(q._id));

  const formatQuestionText = (question: Question['question']) => {
    if (typeof question === 'string') {
      return question;
    }
    return question?.text || 'No question text available';
  };

  const getSubjectDistribution = () => {
    const total = metrics.count;
    return Object.entries(metrics.subjectCounts).map(([subject, count]) => ({
      subject,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };

  const getDifficultyDistribution = () => {
    const total = metrics.count;
    return Object.entries(metrics.difficultyCounts).map(([difficulty, count]) => ({
      difficulty,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      color: difficulty === 'easy' ? 'bg-green-500' :
             difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
    }));
  };

  if (selectedQuestions.length === 0) {
    return (
      <Card className={`border-gray-200 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5" />
            Selected Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions selected</h3>
            <p className="text-gray-600 text-sm">
              Select questions from the list to add them to your test.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-blue-200 ${className}`}>
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
            <CheckCircle className="h-5 w-5" />
            Selected Questions ({metrics.count})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Clear All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{metrics.count}</div>
              <div className="text-sm text-blue-600">Questions</div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{metrics.totalMarks}</div>
              <div className="text-sm text-green-600">Total Marks</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">
                {Object.keys(metrics.subjectCounts).length}
              </div>
              <div className="text-sm text-purple-600">Subjects</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-900">
                {metrics.count > 0 ? Math.round(metrics.totalMarks / metrics.count) : 0}
              </div>
              <div className="text-sm text-orange-600">Avg. Marks</div>
            </div>
          </div>

          {/* Subject Distribution */}
          {Object.keys(metrics.subjectCounts).length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                <BookOpen className="h-4 w-4" />
                Subject Distribution
              </h4>
              <div className="space-y-2">
                {getSubjectDistribution().map(({ subject, count, percentage }) => (
                  <div key={subject} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm text-gray-700 truncate">
                        {subject}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Distribution */}
          {Object.keys(metrics.difficultyCounts).length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
                <BarChart3 className="h-4 w-4" />
                Difficulty Distribution
              </h4>
              <div className="space-y-2">
                {getDifficultyDistribution().map(({ difficulty, count, percentage, color }) => (
                  <div key={difficulty} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm text-gray-700 capitalize">
                        {difficulty}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${color} h-2 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Questions List */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-3">
              <Target className="h-4 w-4" />
              Selected Questions
            </h4>
            
            <ScrollArea className="h-64 border border-gray-200 rounded-lg">
              <div className="p-3 space-y-2">
                {selectedQuestionObjects.map((question, index) => (
                  <div 
                    key={question._id}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          Q{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {question.marks} marks
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {question.subject}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {formatQuestionText(question.question)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveQuestion(question._id)}
                      className="flex-shrink-0 h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectedQuestionsPanel;