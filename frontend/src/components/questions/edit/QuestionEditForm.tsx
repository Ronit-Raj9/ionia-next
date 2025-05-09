"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { QuestionFormState } from '@/redux/slices/questionSlice';

import FormStepper from "@/components/questions/form/FormStepper";
import QuestionContent from "@/components/questions/form/steps/QuestionContent";
import DetailsClassification from "@/components/questions/form/steps/DetailsClassification";
import SolutionHints from "@/components/questions/form/steps/SolutionHints";
import TagsTopics from "@/components/questions/form/steps/TagsTopics";
import SectionSelector from "@/components/questions/form/SectionSelector";
import { useQuestionForm } from "@/components/questions/utils/useQuestionForm";
import { validateForm } from "@/components/questions/utils/validation";
import { FORM_STEPS, SUBJECT_SECTION_MAP } from "@/components/questions/utils/constants";
import { QuestionFormData } from "@/components/questions/utils/types";
import QuestionPreview from './QuestionPreview';
import { useQuestionCleanup } from '@/hooks/useQuestionCleanup';
import { useQuestionDraft } from '@/hooks/useQuestionDraft';

// Define the QuestionUpdateData type
type QuestionUpdateData = QuestionFormState;

interface QuestionEditFormProps {
  question: any;
  onQuestionUpdate: (updatedQuestion: any) => void;
}

const QuestionEditForm: React.FC<QuestionEditFormProps> = ({ question, onQuestionUpdate }) => {
  const [step, setStep] = useState(1);
  const [stepValidation, setStepValidation] = useState([true, true, true, true]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<QuestionUpdateData | null>(null);

  const {
    formData,
    errors,
    setErrors,
    isSaved,
    loading,
    setLoading,
    handleInputChange,
    handleFileUpload,
    handleCorrectOptionChange,
    handleArrayField,
    handleTagInput,
    removeTag,
    addOption,
    removeOption,
    addHint,
    removeHint,
    addCommonMistake,
    removeCommonMistake,
    setFormData
  } = useQuestionForm();

  const [previewImages, setPreviewImages] = useState({
    question: question.question.image?.url || '',
    solution: question.solution.image?.url || '',
    options: question.options.map((opt: any) => opt.image?.url || '') || []
  });

  // Use cleanup and draft hooks
  useQuestionCleanup();
  const { clearCurrentDraft } = useQuestionDraft(true);

  // Initialize form data with the existing question data
  useEffect(() => {
    if (question) {
      const initialFormData: QuestionFormData = {
        // Basic question info
        question: {
          text: question.question?.text || '',
          image: question.question?.image || { url: '', publicId: '' }
        },
        questionType: question.questionType || 'single',
        
        // Classification
        examType: question.examType || 'jee_main',
        class: question.class || 'class_12',
        subject: question.subject || '',
        chapter: question.chapter || '',
        section: question.section || '',
        
        // Metadata
        questionCategory: question.questionCategory || 'theoretical',
        questionSource: question.questionSource || 'custom',
        difficulty: question.difficulty || 'medium',
        marks: question.marks || 1,
        negativeMarks: question.negativeMarks || 0,
        expectedTime: question.expectedTime || 120,
        language: question.language || 'english',
        languageLevel: question.languageLevel || 'intermediate',
        year: question.year || 'not applicable',
        
        // Solution
        solution: {
          text: question.solution?.text || '',
          image: question.solution?.image || { url: '', publicId: '' }
        },
        
        // For MCQ questions
        options: question.options || [
          { text: '', image: { url: '', publicId: '' } },
          { text: '', image: { url: '', publicId: '' } },
          { text: '', image: { url: '', publicId: '' } },
          { text: '', image: { url: '', publicId: '' } }
        ],
        correctOptions: question.correctOptions || [],
        
        // For numerical questions
        numericalAnswer: question.numericalAnswer || {
          exactValue: 0,
          range: {
            min: 0,
            max: 0
          },
          unit: ''
        },
        
        // Additional content
        hints: question.hints || [],
        
        // Tags and topics
        tags: question.tags || [],
        relatedTopics: question.relatedTopics || [],
        prerequisites: question.prerequisites || [],
        
        // Additional fields
        commonMistakes: question.commonMistakes || [],
        conceptualDifficulty: question.conceptualDifficulty || 5,
        isVerified: question.isVerified || false,
        feedback: question.feedback || {
          studentReports: [],
          teacherNotes: []
        },
        isActive: question.isActive
      };

      setFormData(initialFormData);
    }
  }, [question, setFormData]);

  // Validate steps when form data changes
  useEffect(() => {
    const newStepValidation = [true, true, true, true];
    
    // Check each step for validation errors
    for (let i = 1; i <= 4; i++) {
      const validationErrors = validateForm(formData, i);
      newStepValidation[i-1] = Object.keys(validationErrors).length === 0;
    }
    
    setStepValidation(newStepValidation);
  }, [formData]);

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigate with arrow keys + ctrl
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (step < 4) {
          handleNextStep();
        }
      }
      
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousStep();
      }

      // Number keys for direct navigation (1-4) when holding Alt
      if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const targetStep = parseInt(e.key, 10);
        setStep(targetStep);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step]);

  const handlePreviousStep = () => {
    setStep(prev => Math.max(1, prev - 1));
    // Clear any validation errors when moving back
    setErrors({});
  };

  const handleNextStep = () => {
    // Show validation errors but don't prevent navigation
    const validationErrors = validateForm(formData, step);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Show a notification but allow navigation
      toast('Please note: There are some validation errors in this section.', {
        icon: '⚠️',
      });
    } else {
      setErrors({});
    }
    setStep(prev => Math.min(4, prev + 1));
  };

  const handleStepClick = (stepNumber: number) => {
    // Show validation errors for current step before switching
    const validationErrors = validateForm(formData, step);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Show a notification but allow navigation
      toast('Please note: There are some validation errors in this section.', {
        icon: '⚠️',
      });
    } else {
      setErrors({});
    }
    setStep(stepNumber);
  };

  const handleCancel = () => {
    clearCurrentDraft();
    router.push('/admin/questions');
  };

  // Transform form data before submission
  const transformFormDataForBackend = (data: QuestionFormData): QuestionFormState => {
    const transformedData: QuestionFormState = {
      ...data,
      question: {
        text: data.question.text,
        image: data.question.image || { url: '', publicId: '' }
      },
      solution: {
        text: data.solution.text,
        image: data.solution.image || { url: '', publicId: '' }
      },
      options: data.options.map(option => ({
        text: option.text,
        image: option.image || { url: '', publicId: '' }
      })),
      hints: data.hints.map(hint => ({
        text: hint.text,
        image: hint.image || { url: '', publicId: '' }
      })),
      numericalAnswer: data.numericalAnswer ? {
        ...data.numericalAnswer,
        unit: data.numericalAnswer.unit || ''
      } : undefined,
      year: data.year || 'not applicable',
      feedback: data.feedback || { studentReports: [], teacherNotes: [] },
      isVerified: data.isVerified || false
    };
    
    // Ensure we have valid question type
    if (!['single', 'multiple', 'numerical'].includes(transformedData.questionType)) {
      transformedData.questionType = transformedData.correctOptions.length > 1 ? 'multiple' : 'single';
    }
    
    // Make sure questionCategory matches question type for numerical questions
    if (transformedData.questionType === 'numerical') {
      transformedData.questionCategory = 'numerical';
    }
    
    return transformedData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all steps before final submission
    let hasErrors = false;
    let allErrors = {};
    
    for (let i = 1; i <= 4; i++) {
      const stepErrors = validateForm(formData, i);
      if (Object.keys(stepErrors).length > 0) {
        hasErrors = true;
        allErrors = { ...allErrors, ...stepErrors };
      }
    }

    if (hasErrors) {
      setErrors(allErrors);
      toast.error('Please fix all errors before submitting');
      return;
    }

    // Transform data and show preview
    const transformedData = transformFormDataForBackend(formData);
    setPreviewData(transformedData);
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    if (!previewData) return;
    setIsSubmitting(true);
    
    try {
      // Create FormData with transformed values
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(previewData));
      
      // Add files if they exist
      if (formData.question.image instanceof File) {
        formDataToSend.append("questionImage", formData.question.image);
      }
      if (formData.solution.image instanceof File) {
        formDataToSend.append("solutionImage", formData.solution.image);
      }
      
      // Add option images
      formData.options.forEach((option, index) => {
        if (option.image instanceof File) {
          formDataToSend.append("optionImages", option.image);
          formDataToSend.append("optionImageIndexes", index.toString());
        }
      });
      
      // Add hint images
      formData.hints.forEach((hint, index) => {
        if (hint.image instanceof File) {
          formDataToSend.append("hintImages", hint.image);
          formDataToSend.append("hintImageIndexes", index.toString());
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${question._id}`, {
        method: 'PATCH',
        body: formDataToSend,
        credentials: 'include',
      });

      console.log("Response data for edit:", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update question');
      }

      const result = await response.json();
      onQuestionUpdate(result.data);
      toast.success('Question updated successfully!');
      setShowPreview(false);
      
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to update question');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare step data with validation status
  const stepsWithValidation = FORM_STEPS.map((step, index) => ({
    ...step,
    icon: <span>{index + 1}</span>,
    isValid: stepValidation[index]
  }));

  // Handle successful submission
  const handleSubmitSuccess = () => {
    clearCurrentDraft();
    toast.success('Question updated successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper Navigation */}
      <FormStepper 
        currentStep={step} 
        totalSteps={4} 
        steps={stepsWithValidation}
        onStepClick={handleStepClick}
      />

      <form className="mt-6 space-y-8" onSubmit={handleSubmit}>
        {/* Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {step === 1 && (
            <QuestionContent 
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleFileUpload={handleFileUpload}
              setErrors={setErrors}
              handleCorrectOptionChange={handleCorrectOptionChange}
              addOption={addOption}
              removeOption={removeOption}
            />
          )}

          {step === 2 && (
            <>
              <DetailsClassification
                formData={formData}
                errors={errors}
                handleInputChange={handleInputChange}
                handleFileUpload={handleFileUpload}
                setErrors={setErrors}
              />
              
              {formData.subject && formData.subject in SUBJECT_SECTION_MAP && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">
                    {formData.subject.charAt(0).toUpperCase() + formData.subject.slice(1)} Classification
                  </h3>
                  <SectionSelector 
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setFormData={setFormData}
                    subjectKey={formData.subject}
                  />
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <SolutionHints
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleFileUpload={handleFileUpload}
              setErrors={setErrors}
              addHint={addHint}
              removeHint={removeHint}
              addCommonMistake={addCommonMistake}
              removeCommonMistake={removeCommonMistake}
            />
          )}

          {step === 4 && (
            <TagsTopics
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleArrayField={handleArrayField}
              handleTagInput={handleTagInput}
              removeTag={removeTag}
              addCommonMistake={addCommonMistake}
              removeCommonMistake={removeCommonMistake}
              clearFormData={() => {
                if (confirm("Are you sure you want to clear all form data?")) {
                  setFormData({
                    question: { text: '', image: { url: '', publicId: '' } },
                    questionType: 'single',
                    examType: 'jee_main',
                    class: 'class_12',
                    subject: '',
                    chapter: '',
                    section: '',
                    questionCategory: 'theoretical',
                    questionSource: 'custom',
                    difficulty: 'medium',
                    marks: 1,
                    negativeMarks: 0,
                    expectedTime: 120,
                    language: 'english',
                    languageLevel: 'intermediate',
                    year: 'not applicable',
                    solution: { text: '', image: { url: '', publicId: '' } },
                    options: [
                      { text: '', image: { url: '', publicId: '' } },
                      { text: '', image: { url: '', publicId: '' } },
                      { text: '', image: { url: '', publicId: '' } },
                      { text: '', image: { url: '', publicId: '' } }
                    ],
                    correctOptions: [],
                    numericalAnswer: {
                      exactValue: 0,
                      range: { min: 0, max: 0 },
                      unit: ''
                    },
                    hints: [],
                    tags: [],
                    relatedTopics: [],
                    prerequisites: [],
                    commonMistakes: [],
                    conceptualDifficulty: 5,
                    isVerified: false,
                    feedback: { studentReports: [], teacherNotes: [] },
                    isActive: false
                  });
                }
              }}
              handleFileUpload={handleFileUpload}
              setErrors={setErrors}
            />
          )}
        </div>

        {/* Fixed Navigation Bar */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mt-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Next
                  <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      Preview Changes
                      <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <QuestionPreview
          originalQuestion={question}
          updatedData={previewData}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowPreview(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default QuestionEditForm; 