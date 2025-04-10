"use client";
import React from "react";
import { TestQuestion } from "@/redux/slices/testSlice";
import Image from "next/image";

interface OptionProps {
  option: {
    text: string;
    image?: {
      url: string;
      publicId?: string;
    } | null;
  };
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
      <div className="flex-1">
        {option.text && (
          <p className={`text-base transition-colors duration-300 ${selectedAnswer === optionIndex ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
            {option.text}
          </p>
        )}
        {option.image && option.image.url && (
          <div className="mt-2">
            <img 
              src={option.image.url} 
              alt={`Option ${String.fromCharCode(65 + optionIndex)}`}
              className="max-h-40 object-contain rounded-md"
            />
          </div>
        )}
      </div>
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
    return (
      <div className="p-4 text-center border border-yellow-300 bg-yellow-50 rounded-lg">
        <p className="text-yellow-800 font-medium">Question not found</p>
      </div>
    );
  }
  
  // Check if essential question data is missing or malformed
  const isQuestionMalformed = 
    !question.question || 
    (!question.question.text && (!question.question.image || !question.question.image.url)) ||
    !Array.isArray(question.options) ||
    question.options.length === 0;
    
  if (isQuestionMalformed) {
    console.error('Malformed question data:', question);
    return (
      <div className="p-4 text-center border border-red-300 bg-red-50 rounded-lg">
        <p className="text-red-800 font-medium">Question data is malformed</p>
        <p className="text-red-600 text-sm mt-2">The question appears to be in an incorrect format. Please contact support.</p>
      </div>
    );
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
        {question.question.text && (
          <p className="text-lg text-gray-700 leading-relaxed">
            {question.question.text}
          </p>
        )}
        {question.question.image && question.question.image.url && (
          <div className="mt-4">
            <img 
              src={question.question.image.url} 
              alt="Question image"
              className="max-h-96 object-contain rounded-md"
            />
          </div>
        )}
      </div>

      <div className="space-y-4 mt-8">
        {question.options && Array.isArray(question.options) ? question.options.map((option, index) => (
          <QuestionOptions
            key={index}
            option={option}
            optionIndex={index}
            questionNumber={currentQuestion}
            selectedAnswer={selectedAnswer}
            handleOptionChange={handleOptionChange}
          />
        )) : (
          <div className="p-4 text-center text-gray-500">No options available for this question</div>
        )}
      </div>
    </div>
  );
};

export default QuestionPanel;
