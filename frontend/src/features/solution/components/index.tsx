"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipLoader } from 'react-spinners';
import SolutionNavigationBar from './NavigationBar';
import QuestionNavigator from './QuestionNavigator';
import SolutionCard from './SolutionCard';
import SummarySidebar from './Summary';
import { useSolutionStore, useSolutionData, useSolutionLoading, useSolutionError, useFilteredQuestions, useCurrentQuestion, useUserPreferences, useFilter } from '../store/solutionStore';
import { calculatePerformanceMetrics } from '../utils/util';

interface SolutionViewerProps {
  examType: string;
  paperId: string;
  attemptId: string;
}

const SolutionViewer: React.FC<SolutionViewerProps> = ({ examType, paperId, attemptId }) => {
  const router = useRouter();
  
  // Use store hooks
  const solutionData = useSolutionData();
  const loading = useSolutionLoading();
  const error = useSolutionError();
  const filteredQuestions = useFilteredQuestions();
  const currentQuestion = useCurrentQuestion();
  const userPreferences = useUserPreferences();
  const filter = useFilter();
  
  // Store actions
  const {
    fetchSolutionData,
    setFilter,
    setCurrentQuestionIndex,
    updateUserPreferences,
    resetState,
    goToPreviousQuestion,
    goToNextQuestion,
    jumpToQuestion,
    toggleBookmark,
    saveNote,
    exportSolutionData,
    printSolutionData
  } = useSolutionStore();

  // Fetch solution data
  useEffect(() => {
    if (attemptId) {
      console.log('Fetching solution data for attemptId:', attemptId);
      fetchSolutionData(attemptId);
    }
    
    // Cleanup on unmount
    return () => {
      resetState();
    };
  }, [attemptId, fetchSolutionData, resetState]);

  // Debug solution data
  useEffect(() => {
    if (solutionData) {
      console.log('Solution data received:', solutionData);
      console.log('Questions count:', solutionData.questions?.length);
      if (solutionData.questions?.length > 0) {
        console.log('First question:', solutionData.questions[0]);
        console.log('Question content preview:', solutionData.questions[0].question?.substring(0, 100));
      }
    }
  }, [solutionData]);

  // Helper functions for UI interactions

  // Toggle dark mode
  const toggleDarkMode = () => {
    updateUserPreferences({ darkMode: !userPreferences.darkMode });
    
    // Apply dark mode to document
    if (!userPreferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle reading mode
  const toggleReadingMode = () => {
    updateUserPreferences({ readingMode: !userPreferences.readingMode });
  };

  // Get current question index from filtered questions
  const getCurrentQuestionIndex = () => {
    if (!currentQuestion || !filteredQuestions.length) return 0;
    return filteredQuestions.findIndex(q => q.id === currentQuestion.id);
  };

  // Debug current question
  useEffect(() => {
    if (currentQuestion) {
      console.log('Current question:', currentQuestion);
      console.log('Current question content:', currentQuestion.question?.substring(0, 100));
    }
  }, [currentQuestion]);

  // Return to analysis page
  const backToAnalysis = () => {
    router.push(`/exam/${examType}/mock-test/${paperId}/analysis`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <ClipLoader size={50} color="#3B82F6" />
          <p className="mt-4 text-gray-700">Loading solution data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-700 font-medium text-lg mb-2">Error</div>
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={backToAnalysis}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Back to Analysis
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!solutionData || !solutionData.questions || solutionData.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-50 p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-yellow-700 font-medium text-lg mb-2">No solution data</div>
          <div className="text-yellow-600 mb-4">
            We couldn't find any solution data for this test attempt.
          </div>
          <button 
            onClick={backToAnalysis}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Back to Analysis
          </button>
        </div>
      </div>
    );
  }

  // If no questions match the filter
  if (filteredQuestions.length === 0) {
    return (
      <div className={`min-h-screen ${userPreferences.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <SolutionNavigationBar 
          testInfo={solutionData.testInfo}
          filter={filter}
          setFilter={setFilter}
          darkMode={userPreferences.darkMode}
          toggleDarkMode={toggleDarkMode}
          readingMode={userPreferences.readingMode}
          toggleReadingMode={toggleReadingMode}
          backToAnalysis={backToAnalysis}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg shadow-lg">
            <div className="text-yellow-700 dark:text-yellow-200 font-medium text-lg mb-2">No questions match the filter</div>
            <div className="text-yellow-600 dark:text-yellow-300 mb-4">
              Try selecting a different filter option.
            </div>
            <button 
              onClick={() => setFilter('all')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              View All Questions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${userPreferences.darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Navigation Bar */}
      <SolutionNavigationBar 
        testInfo={solutionData.testInfo}
        filter={filter}
        setFilter={setFilter}
        darkMode={userPreferences.darkMode}
        toggleDarkMode={toggleDarkMode}
        readingMode={userPreferences.readingMode}
        toggleReadingMode={toggleReadingMode}
        backToAnalysis={backToAnalysis}
      />

      {/* Question Navigator */}
      <QuestionNavigator 
        questions={filteredQuestions}
        currentQuestionIndex={getCurrentQuestionIndex()}
        jumpToQuestion={jumpToQuestion}
        bookmarkedQuestions={userPreferences.bookmarkedQuestions}
        darkMode={userPreferences.darkMode}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className={`w-full ${!userPreferences.readingMode ? 'lg:w-3/4' : ''}`}>
            {/* Solution Card */}
            {currentQuestion && (
              <SolutionCard 
                question={currentQuestion}
                questionNumber={getCurrentQuestionIndex() + 1}
                totalQuestions={filteredQuestions.length}
                bookmarked={userPreferences.bookmarkedQuestions.includes(currentQuestion.id)}
                toggleBookmark={() => toggleBookmark(currentQuestion.id)}
                note={userPreferences.notes[currentQuestion.id] || ''}
                saveNote={(note) => saveNote(currentQuestion.id, note)}
                darkMode={userPreferences.darkMode}
                readingMode={userPreferences.readingMode}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
              <button
                onClick={goToPreviousQuestion}
                disabled={getCurrentQuestionIndex() === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  getCurrentQuestionIndex() === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:scale-105'
                }`}
              >
                ← Previous
              </button>
              <div className="text-center px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className="text-lg font-semibold">
                  Question {getCurrentQuestionIndex() + 1} of {filteredQuestions.length}
                </span>
              </div>
              <button
                onClick={goToNextQuestion}
                disabled={getCurrentQuestionIndex() === filteredQuestions.length - 1}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  getCurrentQuestionIndex() === filteredQuestions.length - 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:scale-105'
                }`}
              >
                Next →
              </button>
            </div>
          </div>

          {/* Summary Sidebar - Only shown if not in reading mode */}
          {!userPreferences.readingMode && (
            <div className="w-full lg:w-1/4">
              <SummarySidebar 
                performance={solutionData.performance}
                bookmarkedCount={userPreferences.bookmarkedQuestions.length}
                darkMode={userPreferences.darkMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionViewer; 