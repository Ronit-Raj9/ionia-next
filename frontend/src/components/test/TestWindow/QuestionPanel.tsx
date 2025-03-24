"use client";
import React from "react";
import { TestQuestion } from "@/redux/slices/testSlice";

interface OptionProps {
  option: string;
  optionIndex: number;
  questionNumber: number;
  selectedAnswer: number | undefined;
  handleOptionChange: (questionNumber: number, answerIndex: number) => void;
}

const QuestionOptions: React.FC<OptionProps> = ({
  option,
  optionIndex,
  questionNumber,
  selectedAnswer,
  handleOptionChange,
}) => (
  <div 
    onClick={() => handleOptionChange(questionNumber, optionIndex)}
    className={`
      group relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer
      ${selectedAnswer === optionIndex 
        ? 'border-blue-500 bg-blue-50 shadow-sm transform scale-[1.01]' 
        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:scale-[1.005]'}
    `}
  >
    <div className="flex items-center gap-4">
      <div className={`
        w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300
        ${selectedAnswer === optionIndex 
          ? 'border-blue-500 bg-blue-500 text-white transform scale-110' 
          : 'border-gray-300 group-hover:border-blue-300'}
      `}>
        {String.fromCharCode(65 + optionIndex)}
      </div>
      <p className={`
        flex-1 text-base transition-colors duration-300
        ${selectedAnswer === optionIndex ? 'text-blue-700 font-medium' : 'text-gray-700'}
      `}>
        {option}
      </p>
    </div>
    {selectedAnswer === optionIndex && (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-fadeIn">
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    )}
  </div>
);

interface QuestionPanelProps {
  currentQuestion: number;
  selectedAnswer: number | undefined;
  question: TestQuestion;
  handleOptionChange: (questionIndex: number, answerOptionIndex: number) => void;
}

const QuestionPanel: React.FC<QuestionPanelProps> = ({
  currentQuestion,
  selectedAnswer,
  question,
  handleOptionChange,
}) => {
  if (!question) {
    return <div className="p-4 text-center">Question not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Question {currentQuestion + 1}
        </h2>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            {question.subject}
          </div>
          <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            {question.difficulty}
          </div>
          {question.isMarked && (
            <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
              Marked for Review
            </div>
          )}
        </div>
      </div>
      
      <div className="prose prose-blue max-w-none">
        <p className="text-lg text-gray-700 leading-relaxed">
          {question.question}
        </p>
      </div>

      <div className="space-y-4 mt-8">
        {question.options.map((option, index) => (
          <QuestionOptions
            key={index}
            option={option}
            optionIndex={index}
            questionNumber={currentQuestion}
            selectedAnswer={selectedAnswer}
            handleOptionChange={handleOptionChange}
          />
        ))}
      </div>
    </div>
  );
};

export default QuestionPanel;
