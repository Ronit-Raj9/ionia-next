"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipLoader } from 'react-spinners';
import SolutionNavigationBar from './NavigationBar';
import QuestionNavigator from './QuestionNavigator';
import SolutionCard from './SolutionCard';
import SummarySidebar from './Summary';
import { calculatePerformanceMetrics } from './util';
import { API } from '@/lib/api';

interface SolutionViewerProps {
  examType: string;
  paperId: string;
  attemptId: string;
}

const SolutionViewer: React.FC<SolutionViewerProps> = ({ examType, paperId, attemptId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solutionData, setSolutionData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped' | 'bookmarked'>('all');
  const [darkMode, setDarkMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<string[]>([]);
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});

  // Fetch solution data
  useEffect(() => {
    const fetchSolutionData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!attemptId) {
          setError("Attempt ID is required");
          setLoading(false);
          return;
        }

        try {
          // Use the new getSolutions API endpoint
          const response = await API.tests.getSolutions(attemptId);
          
          // Process the fetched data
          const processedData = processSolutionData(response.data);
          setSolutionData(processedData);
          
          // Load user preferences from localStorage
          loadUserPreferences();
        } catch (err) {
          console.error('Error fetching solution data:', err);
          setError(err instanceof Error ? err.message : 'An error occurred while fetching solution data');
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in solution data process:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while processing solution data');
        setLoading(false);
      }
    };

    fetchSolutionData();
  }, [paperId, attemptId]);

  // Load user preferences from localStorage
  const loadUserPreferences = () => {
    // Load dark mode preference
    const darkModePref = localStorage.getItem('darkMode');
    if (darkModePref) {
      setDarkMode(darkModePref === 'true');
    }

    // Load reading mode preference
    const readingModePref = localStorage.getItem('readingMode');
    if (readingModePref) {
      setReadingMode(readingModePref === 'true');
    }

    // Load bookmarked questions
    const bookmarksPref = localStorage.getItem(`bookmarks-${paperId}-${attemptId}`);
    if (bookmarksPref) {
      setBookmarkedQuestions(JSON.parse(bookmarksPref));
    }

    // Load user notes
    const notesPref = localStorage.getItem(`notes-${paperId}-${attemptId}`);
    if (notesPref) {
      setUserNotes(JSON.parse(notesPref));
    }
  };

  // Process the fetched data
  const processSolutionData = (data: any) => {
    // Extract solutions from the API response
    const { attemptId, testId, testTitle, solutions = [] } = data || {};

    console.log("Raw solution data received:", data);
    
    // Process solutions to match our expected format
    const questions = solutions.map((solution: any, index: number) => {
      // Log each solution item to inspect its structure
      console.log(`Processing solution item ${index}:`, solution);
      
      // If content is HTML string, keep as is. If it's an object with a text property, extract that
      let questionContent = 'Question not available';
      
      if (solution.content) {
        if (typeof solution.content === 'string') {
          questionContent = solution.content;
        } else if (typeof solution.content === 'object' && solution.content.text) {
          questionContent = solution.content.text;
        }
      }
      
      // Process options to ensure they're in the right format
      let processedOptions = [];
      if (solution.options) {
        // If options is an array of strings, convert to objects with text property
        if (Array.isArray(solution.options)) {
          processedOptions = solution.options.map((opt: string | { text: string }) => 
            typeof opt === 'string' ? { text: opt } : opt
          );
        }
      }
      
      return {
        id: solution.questionId,
        question: questionContent,
        options: processedOptions.length > 0 ? processedOptions : solution.options || [],
        subject: solution.subject || 'General',
        topic: solution.topic || '',
        difficulty: solution.difficulty || 'Medium',
        userAnswer: solution.userSelected,
        correctAnswer: solution.correctOptions,
        isCorrect: solution.isCorrect,
        timeSpent: solution.timeSpent || 0,
        explanation: solution.explanation || 'No explanation provided',
        averageTime: 60, // Default average time (can be updated with actual data)
      };
    });

    // Log all processed questions to verify
    console.log("Processed questions:", questions.map((q: { id: string; question: string; options: any[]; solution?: any; userAnswer?: any; correctAnswer?: any }) => ({
      id: q.id,
      questionPreview: q.question.substring(0, 50) + (q.question.length > 50 ? '...' : ''),
      optionsCount: q.options.length,
      solutionAvailable: Boolean(q.solution),
      userAnswer: q.userAnswer,
      correctAnswer: q.correctAnswer
    })));

    // Use the utility function to calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(questions);
    
    // Log for debugging
    console.log('Solution performance calculation:', performanceMetrics);

    return {
      testInfo: {
        testId,
        attemptId,
        testTitle,
      },
      questions,
      performance: performanceMetrics
    };
  };

  // Navigate to previous question
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Navigate to next question
  const goToNextQuestion = () => {
    if (solutionData && currentQuestionIndex < solutionData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Jump to a specific question
  const jumpToQuestion = (index: number) => {
    if (solutionData && index >= 0 && index < solutionData.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  // Toggle bookmark for a question
  const toggleBookmark = (questionId: string) => {
    const newBookmarkedQuestions = bookmarkedQuestions.includes(questionId)
      ? bookmarkedQuestions.filter(id => id !== questionId)
      : [...bookmarkedQuestions, questionId];
    
    setBookmarkedQuestions(newBookmarkedQuestions);
    localStorage.setItem(`bookmarks-${paperId}-${attemptId}`, JSON.stringify(newBookmarkedQuestions));
  };

  // Save a note for a question
  const saveNote = (questionId: string, note: string) => {
    const newNotes = { ...userNotes, [questionId]: note };
    setUserNotes(newNotes);
    localStorage.setItem(`notes-${paperId}-${attemptId}`, JSON.stringify(newNotes));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    // Apply dark mode to document
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle reading mode
  const toggleReadingMode = () => {
    const newMode = !readingMode;
    setReadingMode(newMode);
    localStorage.setItem('readingMode', String(newMode));
  };

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

  // Filter questions based on selected filter
  const filteredQuestions = solutionData.questions.filter((question: any) => {
    switch (filter) {
      case 'correct':
        return question.isCorrect;
      case 'incorrect':
        return !question.isCorrect && question.userAnswer !== undefined;
      case 'skipped':
        return question.userAnswer === undefined;
      case 'bookmarked':
        return bookmarkedQuestions.includes(question.id);
      default:
        return true;
    }
  });

  // Get current question
  const currentQuestion = filteredQuestions[currentQuestionIndex] || solutionData.questions[0];

  // If no questions match the filter
  if (filteredQuestions.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <SolutionNavigationBar 
          testInfo={solutionData.testInfo}
          filter={filter}
          setFilter={setFilter}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          readingMode={readingMode}
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
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Navigation Bar */}
      <SolutionNavigationBar 
        testInfo={solutionData.testInfo}
        filter={filter}
        setFilter={setFilter}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        readingMode={readingMode}
        toggleReadingMode={toggleReadingMode}
        backToAnalysis={backToAnalysis}
      />

      {/* Question Navigator */}
      <QuestionNavigator 
        questions={solutionData.questions}
        currentQuestionIndex={currentQuestionIndex}
        jumpToQuestion={jumpToQuestion}
        bookmarkedQuestions={bookmarkedQuestions}
        darkMode={darkMode}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className={`w-full ${!readingMode ? 'lg:w-3/4' : ''}`}>
            {/* Solution Card */}
            <SolutionCard 
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={filteredQuestions.length}
              bookmarked={bookmarkedQuestions.includes(currentQuestion.id)}
              toggleBookmark={() => toggleBookmark(currentQuestion.id)}
              note={userNotes[currentQuestion.id] || ''}
              saveNote={(note) => saveNote(currentQuestion.id, note)}
              darkMode={darkMode}
              readingMode={readingMode}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Previous
              </button>
              <div className="text-center">
                Question {currentQuestionIndex + 1} of {filteredQuestions.length}
              </div>
              <button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === filteredQuestions.length - 1}
                className={`px-4 py-2 rounded-md transition-colors ${
                  currentQuestionIndex === filteredQuestions.length - 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>

          {/* Summary Sidebar - Only shown if not in reading mode */}
          {!readingMode && (
            <div className="w-full lg:w-1/4">
              <SummarySidebar 
                performance={solutionData.performance}
                bookmarkedCount={bookmarkedQuestions.length}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SolutionViewer; 