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
  } | string;  // Support string option format
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
}) => {
  // Handle option as either string or object
  const optionText = typeof option === 'string' ? option : option.text;
  const optionImage = typeof option === 'string' ? null : option.image;

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        selectedAnswer === optionIndex
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-white'
      }`}
      onClick={() => handleOptionChange(questionNumber, optionIndex)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOptionChange(questionNumber, optionIndex);
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 ${
            selectedAnswer === optionIndex
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300'
          } flex items-center justify-center`}
        >
          {selectedAnswer === optionIndex && (
            <div className="w-2 h-2 rounded-full bg-white"></div>
          )}
        </div>
        <div className="flex-grow">
          <div className="text-gray-800">
            {optionText}
          </div>
          
          {optionImage && optionImage.url && (
            <div className="mt-2">
              <img
                src={optionImage.url}
                alt={`Option ${optionIndex + 1} image`}
                className="max-h-40 object-contain rounded"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  // Helper function to render question text and image
  const renderQuestion = () => {
    if (typeof question.question === 'string') {
      // Handle string question
      return (
        <p className="text-lg text-gray-700 leading-relaxed">
          {question.question}
        </p>
      );
    } else {
      // Handle object question
      return (
        <>
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
        </>
      );
    }
  };

  // Validate if the question is empty
  const isQuestionEmpty = 
    typeof question.question === 'string'
      ? !question.question
      : (!question.question.text && (!question.question.image || !question.question.image.url));

  if (isQuestionEmpty || !question.options) {
    return (
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center py-10">
          <div className="text-red-500 text-xl">
            Question data is invalid or missing
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="text-lg font-semibold text-blue-900">
          Question {currentQuestion + 1}
        </div>
        <div className="flex gap-2">
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
        {renderQuestion()}
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
