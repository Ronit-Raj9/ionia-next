"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { calculatePerformanceMetrics } from '../util';

interface QuestionNavigatorProps {
  questions: any[];
  currentQuestionIndex: number;
  jumpToQuestion: (index: number) => void;
  bookmarkedQuestions: string[];
  darkMode: boolean;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentQuestionIndex,
  jumpToQuestion,
  bookmarkedQuestions,
  darkMode,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Scroll to the current question in the navigator
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const currentQuestionElement = scrollContainer.querySelector(`[data-index="${currentQuestionIndex}"]`);
      
      if (currentQuestionElement) {
        const containerWidth = scrollContainer.offsetWidth;
        const elementLeft = (currentQuestionElement as HTMLElement).offsetLeft;
        const elementWidth = (currentQuestionElement as HTMLElement).offsetWidth;
        
        // Center the element in the view
        scrollContainer.scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;
        
        // Check if we need to show scroll arrows
        checkScroll();
      }
    }
  }, [currentQuestionIndex, questions]);

  // Check if scroll arrows should be shown
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    }
  };

  // Handle scroll events
  const handleScroll = () => {
    checkScroll();
  };

  // Scroll left
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  // Scroll right
  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Calculate total progress using the utility function
  const { totalQuestions, totalCorrect, totalIncorrect, totalSkipped } = calculatePerformanceMetrics(questions);
  
  // Calculate percentages for progress bar
  const correctPercent = (totalCorrect / totalQuestions) * 100;
  const incorrectPercent = (totalIncorrect / totalQuestions) * 100;
  const skippedPercent = (totalSkipped / totalQuestions) * 100;

  return (
    <div className={`sticky top-20 z-40 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md py-4`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
          <div className="h-full flex">
            <div 
              className="h-full bg-green-500" 
              style={{ width: `${correctPercent}%` }}
              title={`Correct: ${totalCorrect}/${totalQuestions}`}
            ></div>
            <div 
              className="h-full bg-red-500" 
              style={{ width: `${incorrectPercent}%` }}
              title={`Incorrect: ${totalIncorrect}/${totalQuestions}`}
            ></div>
            <div 
              className="h-full bg-gray-400" 
              style={{ width: `${skippedPercent}%` }}
              title={`Skipped: ${totalSkipped}/${totalQuestions}`}
            ></div>
          </div>
        </div>

        {/* Navigator */}
        <div className="flex items-center">
          {/* Left Scroll Arrow */}
          {showLeftArrow && (
            <button
              onClick={scrollLeft}
              className={`mr-2 p-1 rounded-full ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}

          {/* Question Buttons */}
          <div 
            ref={scrollRef}
            className="flex-1 flex space-x-2 overflow-x-auto scrollbar-hide py-2"
            onScroll={handleScroll}
          >
            {questions.map((question, index) => {
              let bgColor = '';
              let textColor = '';
              let borderColor = '';
              
              if (darkMode) {
                // Dark mode colors
                if (index === currentQuestionIndex) {
                  bgColor = 'bg-blue-700';
                  textColor = 'text-white';
                  borderColor = 'border-blue-500';
                } else if (question.isCorrect) {
                  bgColor = 'bg-green-900';
                  textColor = 'text-green-100';
                } else if (question.userAnswer !== undefined) {
                  bgColor = 'bg-red-900';
                  textColor = 'text-red-100';
                } else {
                  bgColor = 'bg-gray-700';
                  textColor = 'text-gray-200';
                }
              } else {
                // Light mode colors
                if (index === currentQuestionIndex) {
                  bgColor = 'bg-blue-600';
                  textColor = 'text-white';
                  borderColor = 'border-blue-400';
                } else if (question.isCorrect) {
                  bgColor = 'bg-green-500';
                  textColor = 'text-white';
                } else if (question.userAnswer !== undefined) {
                  bgColor = 'bg-red-500';
                  textColor = 'text-white';
                } else {
                  bgColor = 'bg-gray-300';
                  textColor = 'text-gray-700';
                }
              }

              // Add star if bookmarked
              const isBookmarked = bookmarkedQuestions.includes(question.id);
              
              return (
                <button
                  key={index}
                  data-index={index}
                  onClick={() => jumpToQuestion(index)}
                  className={`min-w-[40px] h-10 flex items-center justify-center rounded-md text-sm font-medium border-2 ${
                    index === currentQuestionIndex
                      ? `${bgColor} ${textColor} ${borderColor} border-2`
                      : `${bgColor} ${textColor} border-transparent`
                  } transition-colors relative`}
                  title={`Question ${index + 1} - ${question.isCorrect ? 'Correct' : question.userAnswer !== undefined ? 'Incorrect' : 'Skipped'}`}
                >
                  {index + 1}
                  {isBookmarked && (
                    <span className="absolute -top-1 -right-1 text-yellow-400 text-xs">★</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Scroll Arrow */}
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className={`ml-2 p-1 rounded-full ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator; 