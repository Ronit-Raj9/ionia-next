"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Lightbulb, Send, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionVariant {
  _id: string;
  masterQuestionId: string;
  personalizedQuestion: {
    questionText: string;
    questionType: 'mcq' | 'short_answer' | 'long_answer' | 'numerical' | 'essay' | 'true_false';
    options?: string[];
    hints?: string[];
    scaffolding?: {
      enabled: boolean;
      stepByStepGuidance: string[];
      examples?: string[];
    };
    encouragementNote?: string;
  };
}

interface QuestionAttemptProps {
  assignmentId: string;
  studentId: string;
  chosenQuestionIds: string[];
  onComplete: (results: any) => void;
}

export default function QuestionAttempt({
  assignmentId,
  studentId,
  chosenQuestionIds,
  onComplete
}: QuestionAttemptProps) {
  const [questions, setQuestions] = useState<QuestionVariant[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [hintsViewed, setHintsViewed] = useState<Map<string, string[]>>(new Map());
  const [startTimes, setStartTimes] = useState<Map<string, number>>(new Map());
  const [confidence, setConfidence] = useState<Map<string, 'low' | 'medium' | 'high'>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [assignmentId, studentId, chosenQuestionIds]);

  useEffect(() => {
    // Start timer for current question
    if (questions.length > 0) {
      const currentQuestionId = questions[currentIndex]?.masterQuestionId;
      if (currentQuestionId && !startTimes.has(currentQuestionId)) {
        setStartTimes(new Map(startTimes.set(currentQuestionId, Date.now())));
      }
    }
  }, [currentIndex, questions]);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(
        `/api/assignments/personalize-questions?studentId=${studentId}&assignmentId=${assignmentId}`
      );
      const data = await response.json();
      
      if (data.success) {
        const chosenVariants = data.variants.filter((v: QuestionVariant) =>
          chosenQuestionIds.includes(v.masterQuestionId)
        );
        setQuestions(chosenVariants);
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

  const currentQuestion = questions[currentIndex];

  const handleAnswerChange = (value: string) => {
    if (!currentQuestion) return;
    setAnswers(new Map(answers.set(currentQuestion.masterQuestionId, value)));
  };

  const handleViewHint = (hint: string) => {
    if (!currentQuestion) return;
    const currentHints = hintsViewed.get(currentQuestion.masterQuestionId) || [];
    if (!currentHints.includes(hint)) {
      setHintsViewed(new Map(hintsViewed.set(
        currentQuestion.masterQuestionId,
        [...currentHints, hint]
      )));
    }
  };

  const handleConfidenceChange = (level: 'low' | 'medium' | 'high') => {
    if (!currentQuestion) return;
    setConfidence(new Map(confidence.set(currentQuestion.masterQuestionId, level)));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowHints(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowHints(false);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    const unanswered = questions.filter(q => !answers.has(q.masterQuestionId));
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);

    try {
      const submissionData = questions.map(q => {
        const startTime = startTimes.get(q.masterQuestionId) || Date.now();
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        
        return {
          masterQuestionId: q.masterQuestionId,
          studentAnswer: answers.get(q.masterQuestionId),
          timeSpent,
          hintsUsed: (hintsViewed.get(q.masterQuestionId) || []).length,
          hintsViewed: hintsViewed.get(q.masterQuestionId) || [],
          confidence: confidence.get(q.masterQuestionId) || 'medium'
        };
      });

      const response = await fetch('/api/assignments/submit-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          assignmentId,
          answers: submissionData
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Assignment submitted successfully!');
        onComplete(data);
      } else {
        toast.error('Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="text-center p-8">No questions available</div>;
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Question {currentIndex + 1} of {questions.length}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Time: {Math.floor((Date.now() - (startTimes.get(currentQuestion.masterQuestionId) || Date.now())) / 1000)}s</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-500 h-2 rounded-full"
            />
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion.masterQuestionId}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
        >
          {/* Encouragement Note */}
          {currentQuestion.personalizedQuestion.encouragementNote && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <p className="text-emerald-800 text-sm">
                💚 {currentQuestion.personalizedQuestion.encouragementNote}
              </p>
            </div>
          )}

          {/* Question Text */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 whitespace-pre-wrap">
              {currentQuestion.personalizedQuestion.questionText}
            </h2>
          </div>

          {/* Answer Input */}
          <div className="mb-6">
            {currentQuestion.personalizedQuestion.questionType === 'mcq' ? (
              <div className="space-y-3">
                {currentQuestion.personalizedQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerChange(option)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      answers.get(currentQuestion.masterQuestionId) === option
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-700">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-gray-800">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={answers.get(currentQuestion.masterQuestionId) || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none min-h-[150px]"
              />
            )}
          </div>

          {/* Confidence Level */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How confident are you in your answer?
            </label>
            <div className="flex space-x-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleConfidenceChange(level)}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                    confidence.get(currentQuestion.masterQuestionId) === level
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {level === 'low' ? '😟 Low' : level === 'medium' ? '😐 Medium' : '😊 High'}
                </button>
              ))}
            </div>
          </div>

          {/* Hints Section */}
          {currentQuestion.personalizedQuestion.hints && currentQuestion.personalizedQuestion.hints.length > 0 && (
            <div className="border-t pt-6">
              <button
                onClick={() => setShowHints(!showHints)}
                className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium mb-4"
              >
                <Lightbulb className="w-5 h-5" />
                <span>{showHints ? 'Hide Hints' : `Show Hints (${currentQuestion.personalizedQuestion.hints.length})`}</span>
              </button>
              
              {showHints && (
                <div className="space-y-2">
                  {currentQuestion.personalizedQuestion.hints.map((hint, index) => (
                    <div
                      key={index}
                      onClick={() => handleViewHint(hint)}
                      className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900"
                    >
                      💡 {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Previous</span>
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-500 text-white rounded-lg hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 transition shadow-lg"
            >
              <span>{submitting ? 'Submitting...' : 'Submit Assignment'}</span>
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              <span>Next</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress Summary */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <span>Answered: {answers.size}/{questions.length}</span>
            <span>•</span>
            <span>Hints Used: {Array.from(hintsViewed.values()).reduce((sum, arr) => sum + arr.length, 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

