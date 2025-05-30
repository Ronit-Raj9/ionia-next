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
    <div className="space-y-4">
      {/* Top row buttons */}
      <div className="flex gap-2">
        <button
          onClick={onSaveAndNext}
          disabled={!hasSelectedOption}
          className={`
            px-6 py-2 rounded text-sm font-medium uppercase tracking-wider
            ${hasSelectedOption 
              ? 'bg-[#00C853] hover:bg-[#00B848] text-white' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          Save & Next
        </button>

        <button
          onClick={onClear}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium uppercase tracking-wider hover:bg-gray-50"
        >
          Clear
        </button>

        <button
          onClick={onSaveAndMark}
          className="px-6 py-2 bg-[#FB8C00] hover:bg-[#F57C00] text-white rounded text-sm font-medium uppercase tracking-wider"
        >
          Save & Mark for Review
        </button>

        <button
          onClick={onMarkForReview}
          className="px-6 py-2 bg-[#1976D2] hover:bg-[#1565C0] text-white rounded text-sm font-medium uppercase tracking-wider"
        >
          Mark for Review & Next
        </button>
      </div>

      {/* Bottom navigation buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={isFirstQuestion}
            className={`
              px-4 py-2 rounded text-sm font-medium uppercase tracking-wider
              ${isFirstQuestion
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}
            `}
          >
            &lt;&lt; Back
          </button>
          <button
            onClick={onNext}
            disabled={isLastQuestion}
            className={`
              px-4 py-2 rounded text-sm font-medium uppercase tracking-wider
              ${isLastQuestion
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}
            `}
          >
            Next &gt;&gt;
          </button>
        </div>

        <button
          onClick={onSubmit}
          className={`
            px-6 py-2 rounded text-sm font-medium uppercase tracking-wider
            ${confirmSubmit 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse text-white' 
              : 'bg-[#00C853] hover:bg-[#00B848] text-white'}
          `}
        >
          {confirmSubmit ? 'Confirm Submit' : 'Submit'}
        </button>
      </div>

      {confirmSubmit && (
        <div className="animate-fadeIn p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-center">
            Click 'CONFIRM SUBMIT' again to submit your test. This action cannot be undone.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
