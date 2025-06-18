import { Check, Settings, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TestDetails } from "./types";

interface TestCreationStepperProps {
  activeStep: number;
  onStepClick: (step: number) => void;
  testDetails: TestDetails;
  selectedQuestionsCount: number;
}

export function TestCreationStepper({
  activeStep,
  onStepClick,
  testDetails,
  selectedQuestionsCount
}: TestCreationStepperProps) {
  // Check if required fields in step 1 are filled
  const isStep1Complete = () => {
    return (
      testDetails.title && 
      testDetails.testCategory && 
      testDetails.subject && 
      testDetails.examType && 
      testDetails.class && 
      testDetails.duration
    );
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow-md">
      <div className="flex w-full">
        <button 
          className={`flex-1 py-4 px-6 text-center font-medium rounded-tl-lg transition-colors ${
            activeStep === 1 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onStepClick(1)}
        >
          <div className="flex items-center justify-center gap-2">
            <Settings className="w-5 h-5" /> 
            <span>1. Test Details</span>
            {isStep1Complete() && (
              <Check className="w-5 h-5 text-white" />
            )}
          </div>
        </button>
        
        <button 
          className={`flex-1 py-4 px-6 text-center font-medium rounded-tr-lg transition-colors ${
            activeStep === 2 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onStepClick(2)}
        >
          <div className="flex items-center justify-center gap-2">
            <ListChecks className="w-5 h-5" /> 
            <span>2. Select Questions</span>
            {selectedQuestionsCount > 0 && (
              <Badge variant="default" className="bg-white text-emerald-600 font-bold">{selectedQuestionsCount}</Badge>
            )}
          </div>
        </button>
      </div>
    </div>
  );
} 