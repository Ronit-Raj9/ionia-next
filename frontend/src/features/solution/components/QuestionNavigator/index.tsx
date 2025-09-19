"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { calculatePerformanceMetrics } from '../../utils/util';

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
              className={`mr-4 p-3 rounded-full hover:shadow-lg transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white hover:scale-110 shadow-md' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-110 shadow-md'
              }`}
            >
              <ChevronLeftIcon className="w-7 h-7" />
            </button>
          )}

          {/* Question Buttons */}
          <div 
            ref={scrollRef}
            className="flex-1 flex justify-between items-center overflow-x-auto scrollbar-hide py-4 px-3"
            onScroll={handleScroll}
          >
            {questions.map((question, index) => {

              let bgColor = '';
              let textColor = '';
              let borderColor = '';
              
              if (darkMode) {
                // Dark mode colors - prioritize status over current question
                if (question.isCorrect) {
                  bgColor = 'bg-green-600';
                  textColor = 'text-white';
                  borderColor = index === currentQuestionIndex ? 'border-green-400' : 'border-transparent';
                } else if (question.userAnswer !== undefined && question.userAnswer !== null) {
                  // Wrong answer - very bright red
                  bgColor = 'bg-red-500';
                  textColor = 'text-white';
                  borderColor = index === currentQuestionIndex ? 'border-red-400' : 'border-transparent';
                } else {
                  // Unattempted - darker grey (null or undefined)
                  bgColor = 'bg-gray-600';
                  textColor = 'text-gray-200';
                  borderColor = index === currentQuestionIndex ? 'border-gray-400' : 'border-transparent';
                }
              } else {
                // Light mode colors - prioritize status over current question
                if (question.isCorrect) {
                  bgColor = 'bg-green-500';
                  textColor = 'text-white';
                  borderColor = index === currentQuestionIndex ? 'border-green-400' : 'border-transparent';
                } else if (question.userAnswer !== undefined && question.userAnswer !== null) {
                  // Wrong answer - very bright red
                  bgColor = 'bg-red-600';
                  textColor = 'text-white';
                  borderColor = index === currentQuestionIndex ? 'border-red-400' : 'border-transparent';
                } else {
                  // Unattempted - darker grey (null or undefined)
                  bgColor = 'bg-gray-500';
                  textColor = 'text-gray-700';
                  borderColor = index === currentQuestionIndex ? 'border-gray-400' : 'border-transparent';
                }
              }

              // Add star if bookmarked
              const isBookmarked = bookmarkedQuestions.includes(question.id);
              
              return (
                <button
                  key={index}
                  data-index={index}
                  onClick={() => jumpToQuestion(index)}
                  className={`w-16 h-16 flex items-center justify-center rounded-full text-lg font-bold border-2 mx-1 aspect-square ${
                    index === currentQuestionIndex
                      ? `${bgColor} ${textColor} ${borderColor} shadow-xl transform scale-110 ring-2 ring-blue-300 dark:ring-blue-600`
                      : `${bgColor} ${textColor} ${borderColor} hover:shadow-lg hover:transform hover:scale-105`
                  } transition-all duration-300 relative`}
                  title={`Question ${index + 1} - ${question.isCorrect ? 'Correct' : question.userAnswer !== undefined ? 'Incorrect' : 'Skipped'}`}
                >
                  <span className="font-bold text-lg">{index + 1}</span>
                  {isBookmarked && (
                    <span className="absolute -top-1 -right-1 text-yellow-400 text-xl">★</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Scroll Arrow */}
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className={`ml-4 p-3 rounded-full hover:shadow-lg transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white hover:scale-110 shadow-md' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-110 shadow-md'
              }`}
            >
              <ChevronRightIcon className="w-7 h-7" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigator; 