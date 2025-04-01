"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

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

interface QuestionEditFormProps {
  question: any;
  onQuestionUpdate: (updatedQuestion: any) => void;
}

const QuestionEditForm: React.FC<QuestionEditFormProps> = ({ question, onQuestionUpdate }) => {
  const [step, setStep] = useState(1);
  const [stepValidation, setStepValidation] = useState([true, true, true, true]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
        }
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
  };

  const handleNextStep = () => {
    // Validate the form but don't prevent navigation
    const validationErrors = validateForm(formData, step);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
    }
    
    setStep(prev => Math.min(4, prev + 1));
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
      router.push("/admin/questions");
    }
  };

  const handleStepClick = (stepNumber: number) => {
    setStep(stepNumber);
  };

  // Transform form data before submission
  const transformFormDataForBackend = (formData: QuestionFormData) => {
    const transformedData = {...formData};
    
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
    
    // Validate all steps
    let hasErrors = false;
    for (let i = 1; i <= 4; i++) {
      const stepErrors = validateForm(formData, i);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStep(i);
        hasErrors = true;
        break;
      }
    }

    if (hasErrors) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Transform data to match backend expectations
      const transformedData = transformFormDataForBackend(formData);
      
      // Create FormData with transformed values
      const formDataToSend = new FormData();
      formDataToSend.append("data", JSON.stringify(transformedData));
      
      // Add question images if they have been updated/added
      if (formData.question.image && 
          typeof formData.question.image === 'object' && 
          'file' in formData.question.image &&
          formData.question.image.file instanceof File) {
        formDataToSend.append("questionImage", formData.question.image.file);
      }
      
      // Add solution images if they have been updated/added
      if (formData.solution.image && 
          typeof formData.solution.image === 'object' && 
          'file' in formData.solution.image &&
          formData.solution.image.file instanceof File) {
        formDataToSend.append("solutionImage", formData.solution.image.file);
      }
      
      // Add option images if they have been updated/added
      formData.options.forEach((option, index) => {
        if (option.image && 
            typeof option.image === 'object' && 
            'file' in option.image &&
            option.image.file instanceof File) {
          formDataToSend.append("optionImages", option.image.file);
          formDataToSend.append("optionImageIndexes", index.toString());
        }
      });
      
      // Add hint images if they have been updated/added
      formData.hints.forEach((hint, index) => {
        if (hint.image && 
            typeof hint.image === 'object' && 
            'file' in hint.image &&
            hint.image.file instanceof File) {
          formDataToSend.append("hintImages", hint.image.file);
          formDataToSend.append("hintImageIndexes", index.toString());
        }
      });

      // Make the API request
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/${question._id}`;
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        body: formDataToSend,
        credentials: 'include',
      });

      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Failed to update question';
        } catch (parseError) {
          errorMessage = 'Failed to update question. Please try again.';
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      const result = await response.json();
      
      // Call the callback with the updated question
      if (onQuestionUpdate) {
        onQuestionUpdate(result.data);
      }
      
      // Show success message
      toast.success('Question updated successfully!');
      
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper Navigation */}
      <FormStepper 
        currentStep={step} 
        totalSteps={4} 
        steps={stepsWithValidation}
        onStepClick={handleStepClick}
      />

      <form className="mt-6" onSubmit={handleSubmit}>
        {/* Step 1: Question Content */}
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

        {/* Step 2: Details & Classification */}
        {step === 2 && (
          <>
            <DetailsClassification
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleFileUpload={handleFileUpload}
              setErrors={setErrors}
            />
            
            {/* Show section selector if needed based on subject */}
            {formData.subject && formData.subject in SUBJECT_SECTION_MAP && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">{formData.subject.charAt(0).toUpperCase() + formData.subject.slice(1)} Classification</h3>
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

        {/* Step 3: Solution & Hints */}
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

        {/* Step 4: Tags & Topics */}
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
                  feedback: { studentReports: [], teacherNotes: [] }
                });
              }
            }}
            handleFileUpload={handleFileUpload}
            setErrors={setErrors}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Question'
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionEditForm; 