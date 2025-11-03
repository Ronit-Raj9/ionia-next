"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Target, TrendingUp, AlertCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionVariant {
  _id: string;
  masterQuestionId: string;
  personalizedQuestion: {
    questionText: string;
    questionType: string;
    hints?: string[];
  };
  personalizationDetails: {
    difficultyAdjustment: 'easier' | 'same' | 'harder';
    expectedAccuracy: number;
  };
  viewCount: number;
  timeSpentViewing: number;
}

interface QuestionSelectorProps {
  assignmentId: string;
  studentId: string;
  questionSetId: string;
  totalQuestionsToSelect: number;
  onComplete: (chosenIds: string[], timeline: any[]) => void;
}

const difficultyColors = {
  easier: 'bg-green-100 text-green-700 border-green-300',
  same: 'bg-emerald-100 text-emerald-700 border-blue-300',
  harder: 'bg-red-100 text-red-700 border-red-300'
};

const difficultyIcons = {
  easier: '⚡',
  same: '🎯',
  harder: '🔥'
};

export default function QuestionSelector({
  assignmentId,
  studentId,
  questionSetId,
  totalQuestionsToSelect,
  onComplete
}: QuestionSelectorProps) {
  const [questions, setQuestions] = useState<QuestionVariant[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewQuestion, setPreviewQuestion] = useState<QuestionVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [choiceTimeline, setChoiceTimeline] = useState<any[]>([]);
  const [viewStartTimes, setViewStartTimes] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchQuestions();
  }, [assignmentId, studentId]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(
        `/api/assignments/personalize-questions?studentId=${studentId}&assignmentId=${assignmentId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.variants);
      } else {
        toast.error('Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionView = (question: QuestionVariant) => {
    setPreviewQuestion(question);
    
    // Record view start time
    if (!viewStartTimes.has(question.masterQuestionId)) {
      setViewStartTimes(new Map(viewStartTimes.set(question.masterQuestionId, Date.now())));
    }
    
    // Add to timeline
    setChoiceTimeline([...choiceTimeline, {
      questionId: question.masterQuestionId,
      action: 'viewed',
      timestamp: new Date()
    }]);
  };

  const handleToggleSelection = (questionId: string) => {
    const newSelected = new Set(selectedIds);
    const wasSelected = newSelected.has(questionId);
    
    if (wasSelected) {
      newSelected.delete(questionId);
      setChoiceTimeline([...choiceTimeline, {
        questionId,
        action: 'deselected',
        timestamp: new Date()
      }]);
    } else {
      if (newSelected.size >= totalQuestionsToSelect) {
        toast.error(`You can only select ${totalQuestionsToSelect} questions`);
        return;
      }
      newSelected.add(questionId);
      setChoiceTimeline([...choiceTimeline, {
        questionId,
        action: 'selected',
        timestamp: new Date()
      }]);
    }
    
    setSelectedIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedIds.size !== totalQuestionsToSelect) {
      toast.error(`Please select exactly ${totalQuestionsToSelect} ${totalQuestionsToSelect === 1 ? 'question' : 'questions'}`);
      return;
    }

    setSubmitting(true);
    
    // Add finalized action to timeline
    const finalTimeline = [...choiceTimeline, {
      questionId: 'all',
      action: 'finalized',
      timestamp: new Date()
    }];

    try {
      onComplete(Array.from(selectedIds), finalTimeline);
    } catch (error) {
      toast.error('Failed to submit choices');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading personalized questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Questions
          </h1>
          <p className="text-gray-600 mb-4">
            Choose {totalQuestionsToSelect} {totalQuestionsToSelect === 1 ? 'question' : 'questions'} from the {questions.length} personalized {questions.length === 1 ? 'option' : 'options'} below
          </p>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Selected: {selectedIds.size}/{totalQuestionsToSelect}
              </span>
              <span className="text-sm text-gray-500">
                {totalQuestionsToSelect - selectedIds.size} more to go
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(selectedIds.size / totalQuestionsToSelect) * 100}%` }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-500 h-3 rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Questions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {questions.map((question, index) => {
            const isSelected = selectedIds.has(question.masterQuestionId);
            const difficulty = question.personalizationDetails.difficultyAdjustment;
            
            return (
              <motion.div
                key={question._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-md p-5 border-2 transition-all cursor-pointer hover:shadow-lg ${
                  isSelected 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleToggleSelection(question.masterQuestionId)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{difficultyIcons[difficulty]}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">Question {index + 1}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[difficulty]}`}>
                        {difficulty === 'easier' ? 'Easier' : difficulty === 'same' ? 'Standard' : 'Challenging'}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  )}
                </div>

                {/* Preview Text */}
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                  {question.personalizedQuestion.questionText.substring(0, 150)}...
                </p>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      {question.personalizationDetails.expectedAccuracy}% expected
                    </span>
                    {question.personalizedQuestion.hints && question.personalizedQuestion.hints.length > 0 && (
                      <span className="flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {question.personalizedQuestion.hints.length} hints
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuestionView(question);
                    }}
                    className="flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={handleSubmit}
            disabled={selectedIds.size !== totalQuestionsToSelect || submitting}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-500 text-white rounded-lg font-semibold text-lg hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {submitting ? 'Submitting...' : `Continue with ${selectedIds.size} Questions`}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setPreviewQuestion(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Question Preview</h2>
                <button
                  onClick={() => setPreviewQuestion(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 text-lg whitespace-pre-wrap">
                  {previewQuestion.personalizedQuestion.questionText}
                </p>
              </div>

              {previewQuestion.personalizedQuestion.hints && 
               previewQuestion.personalizedQuestion.hints.length > 0 && (
                <div className="bg-emerald-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Available Hints:</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    {previewQuestion.personalizedQuestion.hints.map((hint, i) => (
                      <li key={i}>💡 {hint}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  handleToggleSelection(previewQuestion.masterQuestionId);
                  setPreviewQuestion(null);
                }}
                className="w-full py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition"
              >
                {selectedIds.has(previewQuestion.masterQuestionId) 
                  ? 'Deselect This Question' 
                  : 'Select This Question'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

