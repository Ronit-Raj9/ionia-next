"use client";
import React from 'react';

interface ActionButtonsProps {
  onSaveAndNext: () => void;
  onClear: () => void;
  onSaveAndMark: () => void;
  onMarkForReview: () => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrevious: () => void;
  confirmSubmit: boolean;
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
  hasSelectedOption: boolean;
  isSubmitting?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onSaveAndNext, 
  onClear, 
  onSaveAndMark, 
  onMarkForReview,
  onSubmit,
  onNext,
  onPrevious,
  confirmSubmit,
  isLastQuestion,
  isFirstQuestion,
  hasSelectedOption,
  isSubmitting = false
}) => {
  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200 min-w-0">
      {/* Debug info */}
      
      {/* Top row buttons - First row */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onSaveAndNext}
          disabled={!hasSelectedOption}
          className={`
            px-4 py-2 rounded text-sm font-medium uppercase tracking-wider whitespace-nowrap min-w-[120px] shadow-sm
            ${hasSelectedOption 
              ? 'bg-[#00C853] hover:bg-[#00B848] text-white' 
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'}
          `}
        >
          SAVE & NEXT
        </button>

        <button
          onClick={onClear}
          className="px-4 py-2 bg-white border-2 border-gray-400 text-gray-800 rounded text-sm font-medium uppercase tracking-wider hover:bg-gray-50 whitespace-nowrap min-w-[80px] shadow-sm"
        >
          CLEAR
        </button>
      </div>

      {/* Second row buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onSaveAndMark}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium uppercase tracking-wider whitespace-nowrap min-w-[160px] shadow-md border-2 border-red-600 transform hover:scale-105 transition-all duration-200"
        >
          SAVE & MARK FOR REVIEW
        </button>

        <button
          onClick={onMarkForReview}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium uppercase tracking-wider whitespace-nowrap min-w-[160px] shadow-sm"
        >
          MARK FOR REVIEW & NEXT
        </button>
      </div>

      {/* Bottom navigation buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={isFirstQuestion}
            className={`
              px-4 py-2 rounded text-sm font-medium uppercase tracking-wider shadow-sm
              ${isFirstQuestion
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gray-300 hover:bg-gray-400 text-gray-700"}
            `}
          >
            &lt;&lt; BACK
          </button>
          <button
            onClick={onNext}
            disabled={isLastQuestion}
            className={`
              px-4 py-2 rounded text-sm font-medium uppercase tracking-wider shadow-sm
              ${isLastQuestion
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-gray-300 hover:bg-gray-400 text-gray-700"}
            `}
          >
            NEXT &gt;&gt;
          </button>
        </div>
      </div>

      {confirmSubmit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-center">
            Click 'CONFIRM SUBMIT' again to submit your test. This action cannot be undone.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
