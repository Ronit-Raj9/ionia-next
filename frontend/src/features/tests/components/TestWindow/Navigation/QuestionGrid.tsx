"use client";
import React from 'react';
import { TestQuestion } from "@/features/tests/store/testStore";
import { NotVisitedIcon, NotAnsweredIcon, AnsweredIcon, MarkedForReviewIcon, AnsweredAndMarkedIcon } from '@/features/tests/components/QuestionPaletteIcons';

interface QuestionGridProps {
  questions: TestQuestion[];
  activeQuestion: number;
  onQuestionClick: (questionNumber: number) => void;
}

const QuestionGrid: React.FC<QuestionGridProps> = ({ questions, activeQuestion, onQuestionClick }) => {
  const getQuestionIcon = (question: TestQuestion) => {
    const isAnswered = question.userAnswer !== undefined;
    const isMarked = question.isMarked;
    const isVisited = question.isVisited;

    if (isAnswered && isMarked) {
      return AnsweredAndMarkedIcon; // Answered & Marked for Review
    }
    if (isMarked) {
      return MarkedForReviewIcon; // Marked for Review
    }
    if (isAnswered) {
      return AnsweredIcon; // Answered
    }
    if (isVisited) {
      return NotAnsweredIcon; // Visited but Not Answered
    }
    return NotVisitedIcon; // Not Visited
  };

  const renderGrid = () => {
    const questionsPerRow = 4;
    const rows = [];
    
    for (let i = 0; i < questions.length; i += questionsPerRow) {
      const rowQuestions = questions.slice(i, i + questionsPerRow);
      const row = (
        <div key={i} className="flex gap-2">
          {rowQuestions.map((question, rowIndex) => {
            const index = i + rowIndex;
            const IconComponent = getQuestionIcon(question);
            const isActive = activeQuestion === index;
            
            return (
              <button
                key={index}
                onClick={() => onQuestionClick(index)}
                className={`
                  relative flex items-center justify-center w-12 h-12 
                  font-medium transition-all duration-200 
                  focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
                  ${isActive ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                `}
                aria-label={`Go to question ${index + 1}`}
              >
                <IconComponent className="w-full h-full" />
                <span className={`absolute text-xs font-bold ${
                  question.userAnswer !== undefined || question.isVisited 
                    ? 'text-white' 
                    : 'text-gray-700'
                }`}>
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>
      );
      rows.push(row);
    }
    
    return rows;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Questions</h3>
      <div
        className="flex flex-col gap-2 overflow-y-auto p-2 rounded-lg bg-gray-50"
        style={{ maxHeight: '300px' }}
      >
        {renderGrid()}
      </div>
    </div>
  );
};

export default QuestionGrid;
