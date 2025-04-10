import { useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Question } from "./types";

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

export function QuestionCard({
  question,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand
}: QuestionCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border ${isSelected ? 'border-green-500' : 'border-green-100'} hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      {/* Question Header - Always visible */}
      <div 
        className={`border-b ${isSelected ? 'border-green-200 bg-green-50' : 'border-green-100 bg-green-50/30'} px-6 py-4 cursor-pointer relative`}
        onClick={() => onSelect(question._id)}
        onDoubleClick={() => onToggleExpand(question._id)}
      >
        {/* Expand/Collapse Icon Button */}
        <button 
          className="absolute top-3 right-3 p-1 rounded-full bg-white/80 hover:bg-white border border-gray-200 shadow-sm z-10"
          onClick={(e) => {
            e.stopPropagation(); // Prevent question selection
            onToggleExpand(question._id);
          }}
          aria-label={isExpanded ? "Collapse question" : "Expand question"}
        >
          <ChevronDown 
            className={`h-4 w-4 text-gray-600 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        </button>
        
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox 
                checked={isSelected}
                onCheckedChange={() => onSelect(question._id)}
                aria-label={`Select question ${question._id}`}
                className="h-5 w-5"
                onClick={(e) => e.stopPropagation()} // Prevent question selection
              />
              <span className={`px-2 py-1 rounded-full text-xs font-medium
                ${question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}`}>
                {question.difficulty}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {question.marks} marks
              </span>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                {question.question.text}
              </h3>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>{question.subject.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} • {question.chapter}</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                {question.questionType === 'single' ? 'Single Choice' : 
                 question.questionType === 'multiple' ? 'Multiple Choice' : 
                 question.questionType === 'numerical' ? 'Numerical' : question.questionType}
              </span>
              {question.class && question.class !== 'none' && (
                <span>Class: {question.class.replace('class_', '')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Question Details */}
            <div className="col-span-8">
              {/* Question Image if available */}
              <div className="mb-3">
                {question.question.image?.url && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <div className="relative aspect-[16/9] w-full">
                      <img 
                        src={question.question.image.url}
                        alt="Question"
                        className="object-contain bg-gray-50 w-full h-full"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Always show options regardless of question type */}
              <div className="space-y-3">
                <h4 className="text-base font-medium text-gray-800 mb-2 flex items-center">
                  <span className="mr-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                    {question.questionType === 'single' ? 'Single Choice' : 
                     question.questionType === 'multiple' ? 'Multiple Choice' : 
                     question.questionType === 'numerical' ? 'Numerical' : 'Unknown Type'}
                  </span>
                  {question.questionType === 'numerical' ? 'Answer:' : 'Options:'}
                </h4>
                
                {/* Options for MCQ/Multiselect */}
                {question.options && question.options.length > 0 && (
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border transition-all ${
                          question.correctOptions?.includes(index)
                            ? 'bg-green-50 border-green-300 shadow-sm'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full border text-sm font-medium ${
                            question.correctOptions?.includes(index)
                              ? 'bg-green-100 border-green-400 text-green-800'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <div className="flex-grow space-y-2">
                            <p className="text-sm text-gray-700">{option.text || `Option ${index+1}`}</p>
                            {option.image?.url && (
                              <div className="rounded-lg overflow-hidden border border-gray-200">
                                <div className="relative aspect-[16/9] w-full">
                                  <img 
                                    src={option.image.url}
                                    alt={`Option ${String.fromCharCode(65 + index)}`}
                                    className="object-contain bg-gray-50 w-full h-full"
                                    loading="lazy"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          {question.correctOptions?.includes(index) && (
                            <span className="flex-shrink-0 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                              <Check className="w-3 h-3 mr-1" /> Correct
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Fallback message if no options */}
                {(!question.options || question.options.length === 0) && question.questionType !== 'numerical' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">No options available for this question.</p>
                  </div>
                )}
              </div>

              {/* Numerical Answer */}
              {question.questionType === 'numerical' && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                  <h4 className="text-base font-medium text-blue-800 mb-3 flex items-center">
                    <span className="mr-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Numerical</span>
                    Numerical Answer:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-sm text-blue-700 font-medium mb-1">Exact Value:</p>
                      <p className="text-lg font-bold text-blue-900">
                        {question.numericalAnswer?.exactValue !== undefined ? question.numericalAnswer.exactValue : 'N/A'} 
                        <span className="text-blue-700 text-sm ml-1">{question.numericalAnswer?.unit}</span>
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-sm text-blue-700 font-medium mb-1">Acceptable Range:</p>
                      <p className="text-lg font-bold text-blue-900">
                        {question.numericalAnswer?.range?.min !== undefined && question.numericalAnswer?.range?.max !== undefined ? 
                          `${question.numericalAnswer.range.min} - ${question.numericalAnswer.range.max}` : 
                          'N/A'}
                        <span className="text-blue-700 text-sm ml-1">{question.numericalAnswer?.unit}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Metadata */}
            <div className="col-span-4 space-y-4">
              {/* Question Info Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Question Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium text-gray-900">{question.subject.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Chapter:</span>
                    <span className="font-medium text-gray-900">{question.chapter}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Class:</span>
                    <span className="font-medium text-gray-900">
                      {question.class ? (question.class === 'none' ? 'N/A' : question.class.replace('class_', '')) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900">{question.questionType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Marks:</span>
                    <span className="font-medium text-gray-900">{question.marks} marks</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Negative Marks:</span>
                    <span className="font-medium text-gray-900">{question.negativeMarks || 0}</span>
                  </div>
                  {question.year && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900">{question.year}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Verification Status */}
                <div className={`rounded-lg p-3 border ${
                  question.isVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {question.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.isVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {question.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Active Status */}
                <div className={`rounded-lg p-3 border ${
                  question.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {question.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {question.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 