import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface FormStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  stepValidationStatus?: {[key: number]: boolean};
}

const FormStepper: React.FC<FormStepperProps> = ({ currentStep, onStepClick, stepValidationStatus = {} }) => {
  const steps = [
    { title: "Question Content", description: "Enter the main question" },
    { title: "Details & Classification", description: "Set question attributes" },
    { title: "Solution & Hints", description: "Add solution and optional hints" },
    { title: "Tags & Topics", description: "Categorize with keywords" },
  ];
  return (
    <div className="mb-8">
      <div className="flex border-b border-gray-200">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          return (
            <button
              key={index}
              onClick={() => {
                console.log(`Clicked step ${stepNumber}`);
                onStepClick(stepNumber);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStepClick(stepNumber);
                }
              }}
              tabIndex={0}
              aria-current={currentStep === stepNumber ? 'step' : undefined}
              aria-pressed={currentStep === stepNumber}
              className={`flex items-center py-3 px-6 text-sm font-medium border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                currentStep === stepNumber 
                  ? 'border-blue-500 text-blue-600' 
                  : stepValidationStatus[stepNumber] === false
                    ? 'border-red-300 text-red-600 hover:border-red-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors`}
            >
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-2 ${
                  stepValidationStatus[stepNumber] === false
                    ? 'bg-red-100 text-red-600 border border-red-500'
                    : stepNumber < currentStep && stepValidationStatus[stepNumber] === true
                      ? 'bg-green-100 text-green-600 border border-green-500'
                      : currentStep === stepNumber
                        ? 'bg-blue-100 text-blue-600 border border-blue-500'
                        : 'bg-gray-100 text-gray-400 border border-gray-300'
                }`}>
                  {stepValidationStatus[stepNumber] === false ? (
                    <XCircle size={14} />
                  ) : stepNumber < currentStep && stepValidationStatus[stepNumber] === true ? (
                    <CheckCircle size={14} />
                  ) : (
                    <span className="text-xs">{stepNumber}</span>
                  )}
                </div>
                {step.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FormStepper; 