"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle } from 'lucide-react';

import { useQuestionForm } from '../utils/useQuestionForm';
import { validateForm } from '../utils/validation';
import { FORM_STEPS, SUBJECT_SECTION_MAP } from '../utils/constants';

import FormStepper from './FormStepper';
import QuestionContent from './steps/QuestionContent';
import DetailsClassification from './steps/DetailsClassification';
import SolutionHints from './steps/SolutionHints';
import TagsTopics from './steps/TagsTopics';
import PreviewModal from './preview/PreviewModal';
import ViewAllChaptersModal from './ViewAllChaptersModal';
import SectionSelector from './SectionSelector';
import { QuestionFormData } from '../utils/types';

const initialFormData: QuestionFormData = {
  // Basic question info
  question: {
    text: '',
    image: { url: '', publicId: '' }
  },
  questionType: 'single',
  
  // Classification
  examType: 'jee_main',
  class: 'class_12',
  subject: '',
  chapter: '',
  section: '',
  
  // Metadata
  questionCategory: 'theoretical',
  questionSource: 'custom',
  difficulty: 'medium',
  marks: 1,
  negativeMarks: 0,
  expectedTime: 120,
  language: 'english',
  languageLevel: 'intermediate',
  year: 'not applicable',
  
  // Solution
  solution: {
    text: '',
    image: { url: '', publicId: '' }
  },
  
  // For MCQ questions
  options: [
    { text: '', image: { url: '', publicId: '' } },
    { text: '', image: { url: '', publicId: '' } },
    { text: '', image: { url: '', publicId: '' } },
    { text: '', image: { url: '', publicId: '' } }
  ],
  correctOptions: [],
  
  // For numerical questions
  numericalAnswer: {
    exactValue: 0,
    range: {
      min: 0,
      max: 0
    },
    unit: ''
  },
  
  // Additional content
  hints: [],
  
  // Tags and topics
  tags: [],
  relatedTopics: [],
  prerequisites: [],
  
  // Additional required fields
  commonMistakes: [],
  conceptualDifficulty: 5,
  isVerified: false,
  feedback: {
    studentReports: [],
    teacherNotes: []
  },
  isActive: true
};

const QuestionForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [stepValidation, setStepValidation] = useState([true, true, true, true]);
  const router = useRouter();
  
  // State for modals
  const [showPreview, setShowPreview] = useState(false);
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    clearFormData,
    setFormData
  } = useQuestionForm();
  
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
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Save already handled by the hook
      }
      
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
  }, [formData, step]);

  const handlePreviousStep = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleNextStep = () => {
    // Still validate the form but don't prevent navigation
    const validationErrors = validateForm(formData, step);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Still proceed to next step
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

  // Add this function to transform form data before submission
  const transformFormDataForBackend = (formData: QuestionFormData) => {
    const transformedData = {...formData};
    
    // Ensure we have valid question type (mcq is not a valid type in the backend)
    if (!['single', 'multiple', 'numerical'].includes(transformedData.questionType)) {
      // Default to single choice if type is invalid
      transformedData.questionType = transformedData.correctOptions.length > 1 ? 'multiple' : 'single';
    }
    
    // Make sure questionCategory matches question type for numerical questions
    if (transformedData.questionType === 'numerical') {
      transformedData.questionCategory = 'numerical';
    }
    
    return transformedData;
  };

  // Modify your handleSubmit function
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

    // Show preview modal instead of submitting directly
    setShowPreview(true);
  };

  // Add this function to handle the actual submission
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    console.log("Form Data before submission:", formData);

    try {
      // Transform data to match backend expectations
      const transformedData = transformFormDataForBackend(formData);
      
      // Create FormData with transformed values
      const formDataToSend = new FormData();
      
      // Add basic question data
      formDataToSend.append("questionText", transformedData.question.text || "");
      formDataToSend.append("questionType", transformedData.questionType);
      formDataToSend.append("examType", transformedData.examType);
      formDataToSend.append("class", transformedData.class);
      formDataToSend.append("subject", transformedData.subject);
      formDataToSend.append("chapter", transformedData.chapter);
      formDataToSend.append("questionCategory", transformedData.questionCategory);
      formDataToSend.append("questionSource", transformedData.questionSource);
      formDataToSend.append("difficulty", transformedData.difficulty);
      formDataToSend.append("marks", transformedData.marks.toString());
      formDataToSend.append("negativeMarks", transformedData.negativeMarks.toString());
      formDataToSend.append("expectedTime", transformedData.expectedTime.toString());
      formDataToSend.append("language", transformedData.language);
      formDataToSend.append("languageLevel", transformedData.languageLevel);
      
      // IMPORTANT: Handle year field properly for PYQs
      // If the question is a previous year question, year is mandatory
      if (transformedData.questionSource === 'pyq') {
        if (!transformedData.year || transformedData.year === 'not applicable') {
          throw new Error('Year must be specified for previous year questions');
        }
        formDataToSend.append("year", transformedData.year);
      } else {
        // For other question sources, year is optional but we still send it
        formDataToSend.append("year", transformedData.year || 'not applicable');
      }
      
      // IMPORTANT: Handle section field properly for all subjects
      const subject = transformedData.subject?.toLowerCase();

      // Check if this subject requires a section
      if (subject && subject in SUBJECT_SECTION_MAP) {
        // Get the section value from the form
        let sectionValue = transformedData.section;
        
        // If section value is missing or doesn't match valid values for this subject,
        // use the first valid section for this subject
        if (!sectionValue || !SUBJECT_SECTION_MAP[subject].includes(sectionValue.toLowerCase())) {
          sectionValue = SUBJECT_SECTION_MAP[subject][0]; // Use the first section as default
          console.log(`Using default section for ${subject}: ${sectionValue}`);
        }
        
        // Add section to form data (ensure lowercase)
        formDataToSend.append("section", sectionValue.toLowerCase());
        console.log(`Added section for ${subject}: ${sectionValue.toLowerCase()}`);
      } else {
        // For subjects that don't require a section, still send 'none'
        formDataToSend.append("section", "none");
        console.log("Added default section: none");
      }

      // Add solution
      formDataToSend.append("solutionText", transformedData.solution.text || "");
      
      // Add images if present - first check if image object exists and has URL
      if (transformedData.question.image?.file) {
        console.log("Adding question image file");
        formDataToSend.append("questionImage", transformedData.question.image.file);
      }
      
      if (transformedData.solution.image?.file) {
        console.log("Adding solution image file");
        formDataToSend.append("solutionImage", transformedData.solution.image.file);
      }

      // Process hints - max 4 hints supported by the backend
      const maxHints = Math.min(transformedData.hints.length, 4);
      console.log(`Processing ${maxHints} hints`);
      
      for (let i = 0; i < maxHints; i++) {
        const hint = transformedData.hints[i];
        formDataToSend.append(`hint${i}Text`, hint.text || "");
        // Add hint image file
        if (hint.image?.file) {
          console.log(`Adding hint${i}Image file`);
          formDataToSend.append(`hint${i}Image`, hint.image.file);
        }
      }
      
      // Add tags, topics, and prerequisites
      formDataToSend.append("tags", JSON.stringify(transformedData.tags));
      formDataToSend.append("relatedTopics", JSON.stringify(transformedData.relatedTopics));
      formDataToSend.append("prerequisites", JSON.stringify(transformedData.prerequisites));
      
      // Add question type specific data
      if (transformedData.questionType === 'numerical' && transformedData.numericalAnswer) {
        const { exactValue, range, unit } = transformedData.numericalAnswer;
        formDataToSend.append("exactValue", exactValue.toString());
        formDataToSend.append("rangeMin", range.min.toString());
        formDataToSend.append("rangeMax", range.max.toString());
        formDataToSend.append("unit", unit || "");
      } else {
        // For MCQ questions
        formDataToSend.append("options", JSON.stringify(transformedData.options.map(opt => opt.text)));
        formDataToSend.append("correctOptions", JSON.stringify(transformedData.correctOptions));
        
        // Add option images as files
        transformedData.options.forEach((option, index) => {
          if (option.image?.file) {
            console.log(`Adding option${index}Image file`);
            formDataToSend.append(`option${index}Image`, option.image.file);
          }
        });
      }

      // Log the API URL being used
      console.log("API base URL:", process.env.NEXT_PUBLIC_API_URL);
      console.log("Sending request to server...");

      // Make the API request
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/upload`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include',
      });

      console.log("Response status:", response.status);
      console.log("Response data:", response);

      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Failed to upload question';
        } catch (parseError) {
          errorMessage = 'Failed to upload question. Please try again.';
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      const result = await response.json();
      
      // Show success message
      toast.success('Question created successfully!');
      
      // Clear form data from localStorage
      localStorage.removeItem('questionDraft');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/admin/questions");
      }, 1500);

    } catch (error) {
      console.error("Error submitting question:", error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit question');
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

  // Define step names for navigation
  const stepNames = FORM_STEPS.map(step => step.title);

  // Define validation result for the current step
  const currentStepValidation = {
    hasErrors: Object.keys(errors).length > 0,
    hasCriticalErrors: Object.keys(errors).some(key => 
      ['question', 'questionCategory', 'questionSource', 'examType', 'class', 'subject', 'chapter', 'solution']
      .includes(key)
    ),
    errors
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Question</h1>
        <p className="mt-2 text-gray-600">
          Fill in the question details below. 
          Use <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm">Ctrl + ←/→</kbd> to navigate steps or 
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm ml-1">Alt + (1-4)</kbd> for direct access.
        </p>
      </div>

      {/* Stepper Navigation */}
      <FormStepper 
        currentStep={step} 
        totalSteps={4} 
        steps={stepsWithValidation}
        onStepClick={handleStepClick}
      />

      <form className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" onSubmit={handleSubmit}>
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
            clearFormData={clearFormData}
            handleFileUpload={handleFileUpload}
            setErrors={setErrors}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button 
            type="button" 
            className="px-4 py-2 text-gray-600 hover:text-gray-800" 
            onClick={() => window.location.href = '/admin/questions'}
          >
            Cancel
          </button>
          
          <div className="flex space-x-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Previous: {stepNames[step - 2] || 'Previous'}
              </button>
            )}
            
            {step < 4 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next: {stepNames[step] || 'Next'}
              </button>
            )}
            
            {step === 4 && (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit Question
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Loading and Success States */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-3" />
            <p className="text-gray-700">Saving question...</p>
          </div>
        </div>
      )}
      
      {isSaved && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Draft saved automatically
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        formData={formData}
        onConfirm={handleConfirmSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Curriculum View Modal */}
      <ViewAllChaptersModal 
        isOpen={showCurriculumModal} 
        onClose={() => setShowCurriculumModal(false)} 
      />
    </div>
  );
};

export default QuestionForm; 