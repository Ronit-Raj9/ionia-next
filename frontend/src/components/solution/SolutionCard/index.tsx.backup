"use client";

import React, { useState } from 'react';
import { BookmarkIcon, PencilIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface SolutionCardProps {
  question: any;
  questionNumber: number;
  totalQuestions: number;
  bookmarked: boolean;
  toggleBookmark: () => void;
  note: string;
  saveNote: (note: string) => void;
  darkMode: boolean;
  readingMode: boolean;
}

const SolutionCard: React.FC<SolutionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  bookmarked,
  toggleBookmark,
  note,
  saveNote,
  darkMode,
  readingMode,
}) => {
  const [showDetailedSolution, setShowDetailedSolution] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentNote, setCurrentNote] = useState(note);
  const [showSimilarQuestions, setShowSimilarQuestions] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState<string | null>(null);

  // Format time
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Determine time comparison
  const getTimeComparison = (userTime: number, avgTime: number): React.ReactNode => {
    if (!userTime || !avgTime) return null;
    
    const ratio = userTime / avgTime;
    let color = 'text-gray-500';
    let text = '';
    
    if (ratio < 0.75) {
      color = 'text-green-500 dark:text-green-400';
      text = `${(1/ratio).toFixed(1)}x faster than average`;
    } else if (ratio > 1.25) {
      color = 'text-red-500 dark:text-red-400';
      text = `${ratio.toFixed(1)}x slower than average`;
    } else {
      color = 'text-gray-500 dark:text-gray-400';
      text = 'Average time';
    }
    
    return <span className={`text-xs ${color} ml-2`}>({text})</span>;
  };

  // Get difficulty badge
  const getDifficultyBadge = (difficulty: string): React.ReactNode => {
    let bgColor = '';
    let textColor = '';
    
    if (darkMode) {
      switch (difficulty.toLowerCase()) {
        case 'easy':
          bgColor = 'bg-green-900';
          textColor = 'text-green-200';
          break;
        case 'medium':
          bgColor = 'bg-yellow-900';
          textColor = 'text-yellow-200';
          break;
        case 'hard':
          bgColor = 'bg-red-900';
          textColor = 'text-red-200';
          break;
        default:
          bgColor = 'bg-gray-700';
          textColor = 'text-gray-200';
      }
    } else {
      switch (difficulty.toLowerCase()) {
        case 'easy':
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          break;
        case 'medium':
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          break;
        case 'hard':
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
      }
    }
    
    return (
      <span className={`${bgColor} ${textColor} text-xs font-medium px-2 py-1 rounded-full`}>
        {difficulty}
      </span>
    );
  };

  // Handle saving notes
  const handleSaveNote = () => {
    saveNote(currentNote);
    setShowNoteEditor(false);
  };

  // Handle report submission (mock implementation)
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation would involve sending the report to backend
    setShowReportModal(false);
    // Show success message
    alert('Thank you for your feedback!');
  };

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Question Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">Question {questionNumber}/{totalQuestions}</span>
            {getDifficultyBadge(question.difficulty)}
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Time taken: {formatTime(question.timeSpent)}
              {getTimeComparison(question.timeSpent, question.averageTime)}
            </span>
          </div>
        </div>

        {/* Topic/Chapter Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {question.subject && (
            <span className={`text-xs ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'} px-2 py-1 rounded-full`}>
              {question.subject}
            </span>
          )}
          {question.topic && (
            <span className={`text-xs ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'} px-2 py-1 rounded-full`}>
              {question.topic}
            </span>
          )}
        </div>

        {/* Question Content */}
        <div className={`${darkMode ? 'text-white' : 'text-gray-800'} font-medium`}>
          {/* Debug info */}
          {(question.question === 'Question not available' || !question.question) && (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-2 mb-4 rounded">
              <p className="text-sm font-bold">Question content missing</p>
              <p className="text-xs">Please check the API response format.</p>
            </div>
          )}
          
          {/* Render question content */}
          <div className="question-content">
            {typeof question.question === 'string' ? (
              <div dangerouslySetInnerHTML={{ __html: question.question }} />
            ) : (
              <p>Question not available in the correct format.</p>
            )}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="space-y-3">
          {question.options && question.options.map((option: any, index: number) => {
            // Determine styling for this option
            const isUserAnswer = question.userAnswer === index;
            const isCorrectAnswer = question.correctAnswer && 
              (Array.isArray(question.correctAnswer) 
                ? question.correctAnswer.includes(index) 
                : question.correctAnswer === index);
            
            // Determine the appropriate class
            let optionClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
            
            if (isUserAnswer && isCorrectAnswer) {
              // User selected this and it's correct
              optionClass = darkMode 
                ? 'bg-green-900 border-green-700 text-green-100' 
                : 'bg-green-100 border-green-500 text-green-800';
            } else if (isUserAnswer && !isCorrectAnswer) {
              // User selected this but it's wrong
              optionClass = darkMode 
                ? 'bg-red-900 border-red-700 text-red-100' 
                : 'bg-red-100 border-red-500 text-red-800';
            } else if (isCorrectAnswer) {
              // This is the correct answer but user didn't select it
              optionClass = darkMode 
                ? 'bg-green-900 border-green-700 text-green-100' 
                : 'bg-green-100 border-green-500 text-green-800';
            }
            
            return (
              <div 
                key={index}
                className={`p-3 rounded-md border ${optionClass} relative`}
              >
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border text-sm font-medium">
                      {String.fromCharCode(65 + index)} {/* A, B, C, D */}
                    </span>
                  </div>
                  <div className="flex-1">
                    {/* Render option content based on its format */}
                    {typeof option === 'string' ? (
                      <div dangerouslySetInnerHTML={{ __html: option }} />
                    ) : typeof option === 'object' && option !== null ? (
                      <div dangerouslySetInnerHTML={{ __html: option.text || 'Option text missing' }} />
                    ) : (
                      <div>Option not available</div>
                    )}
                  </div>
                </div>
                
                {/* Badge for user's selection and correct answer */}
                {isUserAnswer && (
                  <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${
                    isCorrectAnswer 
                      ? (darkMode ? 'bg-green-800 text-green-100' : 'bg-green-600 text-white')
                      : (darkMode ? 'bg-red-800 text-red-100' : 'bg-red-600 text-white')
                  }`}>
                    Your Answer
                  </span>
                )}
                {!isUserAnswer && isCorrectAnswer && (
                  <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${
                    darkMode ? 'bg-green-800 text-green-100' : 'bg-green-600 text-white'
                  }`}>
                    Correct Answer
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Solution Section */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Solution</h3>
          <button
            onClick={() => setShowDetailedSolution(!showDetailedSolution)}
            className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            {showDetailedSolution ? 'Show Brief Solution' : 'Show Detailed Solution'}
          </button>
        </div>

        <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-6`}>
          {/* Display the explanation from our API */}
          {showDetailedSolution ? (
            <div className="space-y-4">
              <p>
                {question.explanation || "No detailed explanation is available for this question."}
              </p>
            </div>
          ) : (
            <p>
              The correct answer is {question.correctAnswer !== undefined 
                ? String.fromCharCode(65 + (Array.isArray(question.correctAnswer) 
                    ? question.correctAnswer[0] 
                    : question.correctAnswer))
                : 'not available'
              }. {question.explanation ? question.explanation.split('.')[0] + '.' : "No explanation available."}
            </p>
          )}
        </div>

        {/* Peer Performance */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-2">Peer Performance</h4>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-md text-sm`}>
            <div className="flex justify-between mb-2">
              <span>Correct answers:</span>
              <span>68%</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Same wrong option:</span>
              <span>22%</span>
            </div>
            <div className="flex justify-between">
              <span>Skipped:</span>
              <span>10%</span>
            </div>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-2">Rate Your Confidence</h4>
          <div className="flex gap-2">
            <button
              onClick={() => setConfidenceLevel('guessed')}
              className={`px-3 py-1 text-sm rounded-md ${
                confidenceLevel === 'guessed'
                  ? (darkMode ? 'bg-red-700 text-white' : 'bg-red-500 text-white')
                  : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
              }`}
            >
              I Guessed
            </button>
            <button
              onClick={() => setConfidenceLevel('unsure')}
              className={`px-3 py-1 text-sm rounded-md ${
                confidenceLevel === 'unsure'
                  ? (darkMode ? 'bg-yellow-700 text-white' : 'bg-yellow-500 text-white')
                  : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
              }`}
            >
              I Was Unsure
            </button>
            <button
              onClick={() => setConfidenceLevel('confident')}
              className={`px-3 py-1 text-sm rounded-md ${
                confidenceLevel === 'confident'
                  ? (darkMode ? 'bg-green-700 text-white' : 'bg-green-500 text-white')
                  : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
              }`}
            >
              I Was Confident
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`p-4 flex flex-wrap gap-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        {/* Bookmark Button */}
        <button
          onClick={toggleBookmark}
          className={`flex items-center px-3 py-2 rounded-md text-sm ${
            bookmarked
              ? (darkMode ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-100 text-yellow-800')
              : (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700')
          }`}
        >
          {bookmarked ? (
            <BookmarkSolidIcon className="w-5 h-5 mr-1 text-yellow-500" />
          ) : (
            <BookmarkIcon className="w-5 h-5 mr-1" />
          )}
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>

        {/* Notes Button */}
        <button
          onClick={() => setShowNoteEditor(!showNoteEditor)}
          className={`flex items-center px-3 py-2 rounded-md text-sm ${
            note
              ? (darkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800')
              : (darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700')
          }`}
        >
          <PencilIcon className="w-5 h-5 mr-1" />
          {note ? 'Edit Notes' : 'Add Notes'}
        </button>

        {/* Report Issue Button */}
        <button
          onClick={() => setShowReportModal(true)}
          className={`flex items-center px-3 py-2 rounded-md text-sm ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <ExclamationCircleIcon className="w-5 h-5 mr-1" />
          Report Issue
        </button>

        {/* Similar Questions Button */}
        <button
          onClick={() => setShowSimilarQuestions(!showSimilarQuestions)}
          className={`flex items-center px-3 py-2 rounded-md text-sm ${
            darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <ArrowPathIcon className="w-5 h-5 mr-1" />
          Similar Questions
        </button>
      </div>

      {/* Note Editor */}
      {showNoteEditor && (
        <div className={`p-4 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-2">Your Notes</h3>
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            className={`w-full p-3 rounded-md ${
              darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            rows={4}
            placeholder="Add your notes here..."
          />
          <div className="flex justify-end mt-3 gap-2">
            <button
              onClick={() => setShowNoteEditor(false)}
              className={`px-3 py-1 rounded-md text-sm ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              className="px-3 py-1 rounded-md text-sm bg-blue-600 text-white"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Similar Questions */}
      {showSimilarQuestions && (
        <div className={`p-4 ${darkMode ? 'bg-gray-900' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-3">Similar Questions</h3>
          
          <div className="space-y-3">
            {/* These would be actual similar questions from your database */}
            {[1, 2, 3].map((idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Similar question {idx} about {question.topic || 'this topic'}
                </p>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs px-2 py-1 rounded-md bg-blue-600 text-white">
                    Practice
                  </button>
                  <button className="text-xs px-2 py-1 rounded-md bg-gray-600 text-white">
                    Add to Custom Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6`}>
            <h3 className="text-lg font-semibold mb-4">Report an Issue</h3>
            <form onSubmit={handleReportSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Issue Type</label>
                <select 
                  className={`w-full p-2 rounded-md border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option>Incorrect Solution</option>
                  <option>Unclear Question</option>
                  <option>Technical Issue</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  className={`w-full p-2 rounded-md border ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'
                  }`}
                  rows={4}
                  placeholder="Describe the issue..."
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className={`px-3 py-2 rounded-md text-sm ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-md text-sm bg-blue-600 text-white"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolutionCard; 