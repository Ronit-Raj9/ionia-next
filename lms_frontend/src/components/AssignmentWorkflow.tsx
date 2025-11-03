"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Clock, AlertCircle, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import QuestionSelector from './QuestionSelector';
import QuestionAttempt from './QuestionAttempt';

interface AssignmentWorkflowProps {
  assignmentId: string;
  studentId: string;
  classId: string;
  onComplete?: () => void;
}

type WorkflowState = 
  | 'loading'
  | 'no_questions'
  | 'analyzing'
  | 'personalizing'
  | 'selecting'
  | 'attempting'
  | 'submitted'
  | 'error';

interface WorkflowStatus {
  state: WorkflowState;
  questionSetId?: string;
  chosenQuestionIds?: string[];
  totalQuestions?: number;
  questionsToAttempt?: number;
  error?: string;
}

export default function AssignmentWorkflow({
  assignmentId,
  studentId,
  classId,
  onComplete
}: AssignmentWorkflowProps) {
  const [status, setStatus] = useState<WorkflowStatus>({ state: 'loading' });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    checkWorkflowStatus();
  }, [assignmentId, studentId]);

  const checkWorkflowStatus = async () => {
    try {
      setStatus({ state: 'loading' });

      // Step 1: Check if question set exists
      const questionSetResponse = await fetch(
        `/api/assignments/create-with-questions?assignmentId=${assignmentId}`
      );
      
      if (!questionSetResponse.ok) {
        if (questionSetResponse.status === 404) {
          setStatus({ state: 'no_questions', error: 'No questions found for this assignment' });
          return;
        }
        throw new Error('Failed to fetch question set');
      }

      const questionSetData = await questionSetResponse.json();
      const questionSetId = questionSetData.questionSet._id;
      const totalQuestions = questionSetData.questionSet.assignmentRules.totalQuestions;
      const questionsToAttempt = questionSetData.questionSet.assignmentRules.questionsToAttempt;

      // Step 2: Check if personalized variants exist
      const variantsResponse = await fetch(
        `/api/assignments/personalize-questions?studentId=${studentId}&assignmentId=${assignmentId}`
      );

      if (!variantsResponse.ok) {
        if (variantsResponse.status === 404) {
          // Need to personalize
          setStatus({ state: 'personalizing', questionSetId });
          await personalizeQuestions(questionSetId);
          return;
        }
        throw new Error('Failed to fetch personalized questions');
      }

      // Step 3: Check if student has made choices
      const choiceResponse = await fetch(
        `/api/assignments/record-choice?studentId=${studentId}&assignmentId=${assignmentId}`
      );

      if (!choiceResponse.ok) {
        if (choiceResponse.status === 404) {
          // Need to select questions
          setStatus({ 
            state: 'selecting', 
            questionSetId,
            totalQuestions,
            questionsToAttempt
          });
          return;
        }
        throw new Error('Failed to fetch choice record');
      }

      const choiceData = await choiceResponse.json();
      const chosenQuestionIds = choiceData.choiceRecord.chosenQuestions;

      // Step 4: Check if student has submitted answers
      const submissionResponse = await fetch(
        `/api/assignments/submit-answers?studentId=${studentId}&assignmentId=${assignmentId}`
      );

      if (!submissionResponse.ok) {
        if (submissionResponse.status === 404) {
          // Need to attempt questions
          setStatus({ 
            state: 'attempting', 
            questionSetId,
            chosenQuestionIds
          });
          return;
        }
        throw new Error('Failed to fetch submission');
      }

      // Already submitted
      const submissionData = await submissionResponse.json();
      setStatus({ 
        state: 'submitted', 
        questionSetId,
        chosenQuestionIds
      });

    } catch (error) {
      console.error('Error checking workflow status:', error);
      setStatus({ 
        state: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const personalizeQuestions = async (questionSetId: string) => {
    try {
      const response = await fetch('/api/assignments/personalize-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionSetId,
          studentIds: [studentId],
          assignmentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to personalize questions');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Questions personalized for you!');
        // Recheck status to move to next step
        setTimeout(() => checkWorkflowStatus(), 1000);
      } else {
        throw new Error(data.message || 'Personalization failed');
      }
    } catch (error) {
      console.error('Error personalizing questions:', error);
      toast.error('Failed to personalize questions');
      setStatus({ 
        state: 'error', 
        error: error instanceof Error ? error.message : 'Personalization failed' 
      });
    }
  };

  const handleQuestionSelection = async (chosenIds: string[], timeline: any[]) => {
    try {
      const response = await fetch('/api/assignments/record-choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          questionSetId: status.questionSetId,
          assignmentId,
          chosenQuestionIds: chosenIds,
          choiceTimeline: timeline
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Questions selected! Starting assignment...');
        setStatus({
          ...status,
          state: 'attempting',
          chosenQuestionIds: chosenIds
        });
      } else {
        throw new Error(data.message || 'Failed to record choices');
      }
    } catch (error) {
      console.error('Error recording choices:', error);
      toast.error('Failed to record your choices');
    }
  };

  const handleAssignmentComplete = (results: any) => {
    toast.success(`Assignment completed! Score: ${results.summary.percentage}%`);
    setStatus({ ...status, state: 'submitted' });
    
    if (onComplete) {
      setTimeout(onComplete, 2000);
    }
  };

  const handleRetry = () => {
    setRetryCount(retryCount + 1);
    checkWorkflowStatus();
  };

  // Render different states
  if (status.state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Assignment...</h2>
          <p className="text-gray-600">Preparing your personalized questions</p>
        </div>
      </div>
    );
  }

  if (status.state === 'no_questions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-6">
            This assignment doesn't have any questions yet. Please contact your teacher.
          </p>
          <button
            onClick={() => onComplete?.()}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (status.state === 'analyzing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <Brain className="w-8 h-8 text-emerald-600 absolute top-4 left-1/2 transform -translate-x-1/2" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Analyzing Questions...</h2>
          <p className="text-gray-600">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (status.state === 'personalizing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Personalizing Questions...</h2>
          <p className="text-gray-600">Creating questions tailored to your learning style</p>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (status.state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
          <p className="text-gray-600 mb-6">{status.error || 'An unexpected error occurred'}</p>
          <div className="flex space-x-3">
            <button
              onClick={handleRetry}
              className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => onComplete?.()}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status.state === 'selecting') {
    return (
      <QuestionSelector
        assignmentId={assignmentId}
        studentId={studentId}
        questionSetId={status.questionSetId!}
        totalQuestionsToSelect={status.questionsToAttempt!}
        onComplete={handleQuestionSelection}
      />
    );
  }

  if (status.state === 'attempting') {
    return (
      <QuestionAttempt
        assignmentId={assignmentId}
        studentId={studentId}
        chosenQuestionIds={status.chosenQuestionIds!}
        onComplete={handleAssignmentComplete}
      />
    );
  }

  if (status.state === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assignment Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your responses have been submitted successfully. Your teacher will review them soon.
          </p>
          <button
            onClick={() => onComplete?.()}
            className="w-full px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            View Results
          </button>
        </motion.div>
      </div>
    );
  }

  return null;
}

