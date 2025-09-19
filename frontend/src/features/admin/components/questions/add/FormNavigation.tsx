import React from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { StepValidationResult } from '@/types/form';

interface FormNavigationProps {
  activeStep: number;
  totalSteps: number;
  stepNames: string[];
  isSubmitting: boolean;
  canSubmit: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
  validationResult: StepValidationResult;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  activeStep,
  totalSteps,
  stepNames = ["Step 1", "Step 2", "Step 3", "Step 4"],
  isSubmitting,
  canSubmit,
  onPrevStep,
  onNextStep,
  onSubmit,
  validationResult
}) => {
  const isLastStep = activeStep === totalSteps;
  const hasErrors = validationResult?.hasErrors || false;
  const hasCriticalErrors = validationResult?.hasCriticalErrors || false;

  return (
    <div className="flex items-center justify-between w-full mt-8 pt-5 border-t border-gray-200">
      <div className="flex-1">
        {activeStep > 1 && (
          <button
            type="button"
            onClick={onPrevStep}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 text-sm font-medium rounded text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" />
            Previous: {stepNames[Math.max(0, activeStep - 2)] || "Previous Step"}
          </button>
        )}
      </div>

      <div className="flex-1 text-center">
        <span className="text-sm text-gray-500 hidden sm:inline">
          Step {activeStep} of {totalSteps}: <span className="font-medium text-gray-700">{stepNames[Math.max(0, activeStep - 1)] || `Step ${activeStep}`}</span>
        </span>
      </div>

      <div className="flex-1 flex justify-end">
        {!isLastStep ? (
          <button
            type="button"
            onClick={onNextStep}
            disabled={isSubmitting || hasCriticalErrors}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded ${
              hasCriticalErrors
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition-colors`}
          >
            Next: {stepNames[Math.min(stepNames.length - 1, activeStep)] || "Next Step"}
            <ChevronRight size={16} className="ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Submit Question
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default FormNavigation; 