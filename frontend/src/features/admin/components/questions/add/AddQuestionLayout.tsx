"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, ArrowLeft, Save, Eye, RotateCcw } from 'lucide-react';

import { useQuestionStore } from '../../../store/questionStore';
import { useQuestionForm } from '../../../utils/useQuestionForm';
import { validateForm } from '../../../utils/validation';
import { FORM_STEPS } from '../../../utils/constants';

import FormStepper from './FormStepper';
import FormNavigation from './FormNavigation';
import QuestionContent from './steps/QuestionContent';
import DetailsClassification from './steps/DetailsClassification';
import SolutionHints from './steps/SolutionHints';
import TagsTopics from './steps/TagsTopics';
import PreviewModal from './preview/PreviewModal';
import ViewAllChaptersModal from './ViewAllChaptersModal';
import SectionSelector from './SectionSelector';
import { QuestionFormData } from '../utils/types';

interface AddQuestionLayoutProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddQuestionLayout: React.FC<AddQuestionLayoutProps> = ({
  onSuccess,
  onCancel
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepValidationStatus, setStepValidationStatus] = useState<{[key: number]: boolean}>({});

  const {
    loading,
    error: storeError,
    createQuestion,
    clearError
  } = useQuestionStore();

  const {
    formData,
    setFormData,
    errors,
    setErrors,
    handleInputChange,
    handleFileUpload,
    handleArrayField,
    handleCorrectOptionChange,
    handleTagInput,
    removeTag,
    addOption,
    removeOption,
    addHint,
    removeHint,
    addCommonMistake,
    removeCommonMistake,
    clearFormData
  } = useQuestionForm();

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Validate all steps and update their status
  const validateAllStepsStatus = () => {
    const newStatus: {[key: number]: boolean} = {};
    
    for (let step = 1; step <= FORM_STEPS.length; step++) {
      const stepErrors = validateForm(formData, step);
      newStatus[step] = Object.keys(stepErrors).length === 0;
    }
    
    setStepValidationStatus(newStatus);
    return newStatus;
  };

  // Update step validation status whenever formData changes
  useEffect(() => {
    validateAllStepsStatus();
  }, [formData]);

  const handleStepChange = (step: number) => {
    // Validate the current step before leaving
    const currentStepErrors = validateForm(formData, currentStep);
    if (Object.keys(currentStepErrors).length > 0) {
      // Update validation status immediately
      validateAllStepsStatus();
    }
    
    // Allow free navigation between steps
    setCurrentStep(step);
    // Clear errors when changing steps to avoid confusion
    setErrors({});
  };

  const handleNext = () => {
    if (currentStep < FORM_STEPS.length) {
      // Validate current step before moving
      validateAllStepsStatus();
      setCurrentStep(currentStep + 1);
      setErrors({});
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      // Validate current step before moving
      validateAllStepsStatus();
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    // Validate entire form
    const formValidation = validateAllSteps();
    
    if (Object.keys(formValidation).length > 0) {
      setErrors(formValidation);
      toast.error('Please fix all errors before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert form data to API format
      const apiData = convertFormDataToApiFormat(formData);
      
      await createQuestion(apiData);
      
      toast.success('Question created successfully!', {
        duration: 4000,
        icon: '🎉',
      });

      // Silently clear form data without confirmation (successful submission)
      const silentClearFormData = () => {
        localStorage.removeItem('questionDraft');
        const defaultFormData = {
          question: { text: "", image: { url: "", publicId: "", file: null } },
          options: [
            { text: "", image: { url: "", publicId: "", file: null } },
            { text: "", image: { url: "", publicId: "", file: null } },
            { text: "", image: { url: "", publicId: "", file: null } }, 
            { text: "", image: { url: "", publicId: "", file: null } }
          ],
          correctOptions: [],
          questionType: "single" as const,
          questionCategory: "theoretical" as const,
          questionSource: "custom" as const,
          examType: "jee_main" as const,
          class: "class_12" as const,
          subject: "",
          chapter: "",
          section: "",
          difficulty: "medium" as const,
          year: "not applicable" as const,
          languageLevel: "intermediate" as const,
          language: "english" as const,
          solution: { text: "", image: { url: "", publicId: "", file: null } },
          hints: [],
          tags: [],
          relatedTopics: [],
          prerequisites: [],
          marks: 1,
          negativeMarks: 0,
          expectedTime: 120,
          commonMistakes: [],
          conceptualDifficulty: 5,
          isVerified: false,
          numericalAnswer: {
            exactValue: 0,
            range: { min: 0, max: 0 },
            unit: ""
          },
          feedback: { studentReports: [], teacherNotes: [] },
          isActive: true
        };
        setFormData(defaultFormData);
        setErrors({});
        setCurrentStep(1);
      };
      
      silentClearFormData();
      
      // Redirect or call success callback
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating question:', error);
      toast.error(error.message || 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    // Show preview regardless of validation status
    // Users can see what they've entered so far
    setShowPreview(true);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the form? All entered data will be lost.')) {
      clearFormData();
      setCurrentStep(1);
      setErrors({});
      toast.success('Form reset successfully');
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges() && 
        !confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return;
    }
    onCancel?.();
  };

  const hasUnsavedChanges = (): boolean => {
    return formData.question.text.trim() !== '' || 
           formData.solution.text.trim() !== '' ||
           formData.subject !== '';
  };

  const isFormValid = (): boolean => {
    // Validate all steps for comprehensive check
    let allErrors: any = {};
    for (let step = 1; step <= FORM_STEPS.length; step++) {
      const stepErrors = validateForm(formData, step);
      allErrors = { ...allErrors, ...stepErrors };
    }
    return Object.keys(allErrors).length === 0;
  };

  const validateAllSteps = () => {
    // Validate all steps and return combined errors
    let allErrors: any = {};
    for (let step = 1; step <= FORM_STEPS.length; step++) {
      const stepErrors = validateForm(formData, step);
      allErrors = { ...allErrors, ...stepErrors };
    }
    return allErrors;
  };

  const convertFormDataToApiFormat = (data: QuestionFormData): any => {
    return {
      questionText: data.question.text,
      questionType: data.questionType,
      subject: data.subject,
      chapter: data.chapter,
      examType: data.examType,
      class: data.class,
      difficulty: data.difficulty,
      marks: data.marks,
      negativeMarks: data.negativeMarks,
      solutionText: data.solution.text,
      language: data.language,
      languageLevel: data.languageLevel,
      questionCategory: data.questionCategory,
      questionSource: data.questionSource,
      section: data.section,
      year: data.year,
      options: data.questionType !== 'numerical' ? data.options?.map(opt => opt.text) : undefined,
      correctOptions: data.questionType !== 'numerical' ? data.correctOptions : undefined,
      exactValue: data.questionType === 'numerical' ? data.numericalAnswer?.exactValue : undefined,
      rangeMin: data.questionType === 'numerical' ? data.numericalAnswer?.range.min : undefined,
      rangeMax: data.questionType === 'numerical' ? data.numericalAnswer?.range.max : undefined,
      unit: data.questionType === 'numerical' ? data.numericalAnswer?.unit : undefined,
      tags: data.tags,
      prerequisites: data.prerequisites,
      commonMistakes: data.commonMistakes,
      conceptualDifficulty: data.conceptualDifficulty,
      questionImage: data.question.image?.file,
      solutionImage: data.solution.image?.file,
      optionImages: data.options?.map(opt => opt.image?.file).filter(Boolean),
      hint0Text: data.hints?.[0]?.text,
      hint1Text: data.hints?.[1]?.text,
      hint2Text: data.hints?.[2]?.text,
      hint0Image: data.hints?.[0]?.image?.file,
      hint1Image: data.hints?.[1]?.image?.file,
      hint2Image: data.hints?.[2]?.image?.file,
    };
  };

  const renderCurrentStep = () => {
    const baseStepProps = {
      formData,
      errors,
      handleInputChange,
      handleFileUpload,
      handleArrayField,
      setErrors
    };

    switch (currentStep) {
      case 1:
        return (
          <QuestionContent 
            {...baseStepProps} 
            handleCorrectOptionChange={handleCorrectOptionChange}
            addOption={addOption}
            removeOption={removeOption}
          />
        );
      case 2:
        return <DetailsClassification {...baseStepProps} />;
      case 3:
        return (
          <SolutionHints 
            {...baseStepProps}
            addHint={addHint}
            removeHint={removeHint}
            addCommonMistake={addCommonMistake}
            removeCommonMistake={removeCommonMistake}
          />
        );
      case 4:
        return (
          <TagsTopics 
            {...baseStepProps}
            handleTagInput={handleTagInput}
            removeTag={removeTag}
            addCommonMistake={addCommonMistake}
            removeCommonMistake={removeCommonMistake}
            clearFormData={clearFormData}
          />
        );
      default:
        return (
          <QuestionContent 
            {...baseStepProps} 
            handleCorrectOptionChange={handleCorrectOptionChange}
            addOption={addOption}
            removeOption={removeOption}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Question</h1>
              <p className="mt-1 text-gray-600">
                Create a new question for the question bank
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
              
              <button
                onClick={handlePreview}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </button>
              
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
            </div>
          </div>

          {/* Error Display */}
          {storeError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{storeError}</p>
            </div>
          )}
        </div>

        {/* Form Stepper */}
        <div className="mb-8">
          <FormStepper 
            currentStep={currentStep} 
            onStepClick={handleStepChange}
            stepValidationStatus={stepValidationStatus}
          />
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {renderCurrentStep()}
          </div>

          {/* Form Navigation */}
          <div className="border-t border-gray-200 px-6 py-4">
            <FormNavigation
              currentStep={currentStep}
              totalSteps={FORM_STEPS.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canSubmit={isFormValid() && currentStep === FORM_STEPS.length}
            />
          </div>
        </div>

        {/* Modals */}
        {showPreview && (
          <PreviewModal
            formData={formData}
            onClose={() => setShowPreview(false)}
          />
        )}

        {showChaptersModal && (
          <ViewAllChaptersModal
            isOpen={showChaptersModal}
            onClose={() => setShowChaptersModal(false)}
          />
        )}
      </div>
    </div>
  );
};