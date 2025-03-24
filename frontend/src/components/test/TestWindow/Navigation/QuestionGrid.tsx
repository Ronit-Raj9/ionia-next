"use client";
import React from 'react';
import { TestQuestion } from "@/redux/slices/testSlice";
import { NotVisitedIcon, NotAnsweredIcon, AnsweredIcon, MarkedForReviewIcon, AnsweredAndMarkedIcon } from '@/components/QuestionPaletteIcons';

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
    return questions.map((question, index) => {
      const IconComponent = getQuestionIcon(question);
      return (
        <button
          key={index}
          onClick={() => onQuestionClick(index)}
          className={`
            relative flex items-center justify-center w-12 h-12 rounded-md 
            font-medium transition-all duration-200 
            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
            ${activeQuestion === index ? 'ring-2 ring-blue-500' : ''}
          `}
          aria-label={`Go to question ${index + 1}`}
        >
          <IconComponent className="w-8 h-8" />
          <span className="absolute text-xs font-bold text-black">{index + 1}</span>
        </button>
      );
    });
  };

  return (
    <div className="p-2">
      <h3 className="text-lg font-semibold mb-3">Questions</h3>
      <div
        className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2 overflow-y-auto p-2 rounded-lg bg-gray-50"
        style={{ maxHeight: '350px' }}
      >
        {renderGrid()}
      </div>
    </div>
  );
};

export default QuestionGrid;
