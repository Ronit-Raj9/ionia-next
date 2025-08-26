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
    clearFormData
  } = useQuestionForm();

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleStepChange = (step: number) => {
    const stepValidation = validateForm(formData, step);
    
    if (Object.keys(stepValidation).length > 0) {
      setErrors(stepValidation);
      toast.error(`Please fix the errors in step ${step} before proceeding`);
      return;
    }
    
    setCurrentStep(step);
    setErrors({});
  };

  const handleNext = () => {
    if (currentStep < FORM_STEPS.length) {
      handleStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
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

      // Reset form and redirect
      clearFormData();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating question:', error);
      toast.error(error.message || 'Failed to create question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    const formValidation = validateAllSteps();
    
    if (Object.keys(formValidation).length > 0) {
      setErrors(formValidation);
      toast.error('Please fix errors before previewing');
      return;
    }
    
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
    const stepProps = {
      formData,
      errors,
      handleInputChange,
      handleFileUpload,
      handleArrayField,
      setErrors
    };

    switch (currentStep) {
      case 1:
        return <QuestionContent {...stepProps} />;
      case 2:
        return <DetailsClassification {...stepProps} />;
      case 3:
        return <SolutionHints {...stepProps} />;
      case 4:
        return <TagsTopics {...stepProps} />;
      default:
        return <QuestionContent {...stepProps} />;
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
            errors={errors}
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
            subject={formData.subject}
            onClose={() => setShowChaptersModal(false)}
            onChapterSelect={(chapter) => {
              handleInputChange('chapter', chapter);
              setShowChaptersModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};