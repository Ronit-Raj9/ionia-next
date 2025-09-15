"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, Download } from "lucide-react";
import QuestionPreviewModal from './QuestionPreviewModal';
import { Question, UpdateQuestionData } from "@/features/admin/types";
import { updateQuestion } from "@/features/admin/api/questionApi";
import { useQuestionStore } from "@/features/admin/store/questionStore";
import { useQuestionForm } from "../../../utils/useQuestionForm";

// Form step components
import QuestionContentStep from "../add/steps/QuestionContent";
import DetailsClassificationStep from "../add/steps/DetailsClassification";
import SolutionHintsStep from "../add/steps/SolutionHints";
import TagsTopicsStep from "../add/steps/TagsTopics";

interface QuestionEditFormProps {
  question: Question;
  onQuestionUpdate: (updatedQuestion: Question) => void;
}


const STEPS = [
  { id: 1, title: "Question Content", description: "Define the question and options" },
  { id: 2, title: "Details & Classification", description: "Set metadata and classification" },
  { id: 3, title: "Solution & Hints", description: "Add solution and helpful hints" },
  { id: 4, title: "Tags & Topics", description: "Add tags and related topics" }
];

const QuestionEditForm: React.FC<QuestionEditFormProps> = ({ question, onQuestionUpdate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepValidation, setStepValidation] = useState([false, false, false, false]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const router = useRouter();
  const { updateQuestion: updateQuestionInStore } = useQuestionStore();
  
  // Use the question form hook for state management
  const { 
    formData, 
    setFormData, 
    errors, 
    setErrors,
    handleInputChange: hookHandleInputChange,
    handleFileUpload: hookHandleFileUpload,
    handleCorrectOptionChange: hookHandleCorrectOptionChange,
    handleTagInput: hookHandleTagInput,
    removeTag: hookRemoveTag,
    addOption: hookAddOption,
    removeOption: hookRemoveOption,
    addHint: hookAddHint,
    removeHint: hookRemoveHint,
    addCommonMistake: hookAddCommonMistake,
    removeCommonMistake: hookRemoveCommonMistake,
    clearFormData
  } = useQuestionForm();

  // Initialize form data from question
  useEffect(() => {
    if (question) {
      
      // Convert Question format to QuestionFormData format
      const questionFormData = {
        question: {
          text: question.question?.text || '',
          image: {
            url: question.question?.image?.url || '',
            publicId: question.question?.image?.publicId || '',
            file: null
          }
        },
        options: question.options?.map(opt => ({
          text: opt.text || '',
          image: {
            url: opt.image?.url || '',
            publicId: opt.image?.publicId || '',
            file: null
          }
        })) || [
          { text: '', image: { url: '', publicId: '', file: null } },
          { text: '', image: { url: '', publicId: '', file: null } },
          { text: '', image: { url: '', publicId: '', file: null } },
          { text: '', image: { url: '', publicId: '', file: null } }
        ],
        correctOptions: question.correctOptions || [],
        questionType: (question.questionType === 'mcq' ? 'single' : question.questionType === 'assertion' ? 'single' : question.questionType) as 'single' | 'multiple' | 'numerical',
        questionCategory: (question.questionCategory === 'conceptual' ? 'theoretical' : question.questionCategory) as 'numerical' | 'theoretical',
        questionSource: (question.questionSource === 'platform' ? 'custom' : question.questionSource) as 'custom' | 'india_book' | 'foreign_book' | 'pyq',
        examType: (question.examType === 'NONE' ? 'none' : question.examType || 'jee_main') as 'jee_main' | 'jee_adv' | 'cuet' | 'neet' | 'cbse_11' | 'cbse_12' | 'none',
        class: (question.class === 'N/A' ? 'none' : question.class || 'class_12') as 'none' | 'class_9' | 'class_10' | 'class_11' | 'class_12',
        year: question.year || 'not applicable',
        subject: question.subject || '',
        section: question.section || '',
        chapter: question.chapter || '',
        difficulty: question.difficulty || 'medium',
        language: (question.language === 'hindi' ? 'hindi' : 'english') as 'english' | 'hindi',
        languageLevel: question.languageLevel || 'intermediate',
        marks: question.marks || 1,
        negativeMarks: question.negativeMarks || 0,
        expectedTime: 120, // Default value
        conceptualDifficulty: question.conceptualDifficulty || 5,
        solution: {
          text: question.solution?.text || '',
          image: {
            url: question.solution?.image?.url || '',
            publicId: question.solution?.image?.publicId || '',
            file: null
          }
        },
        hints: question.hints?.map(hint => ({
          text: hint.text || '',
          image: {
            url: hint.image?.url || '',
            publicId: hint.image?.publicId || '',
            file: null
          }
        })) || [],
        commonMistakes: (question.commonMistakes || []).map(mistake => 
          typeof mistake === 'string' 
            ? { description: mistake, explanation: '' }
            : mistake
        ),
        tags: question.tags || [],
        relatedTopics: (question as any).relatedTopics || [],
        prerequisites: question.prerequisites || [],
        isVerified: question.isVerified || false,
        numericalAnswer: {
          exactValue: question.numericalAnswer?.exactValue || 0,
          range: {
            min: question.numericalAnswer?.range?.min || 0,
            max: question.numericalAnswer?.range?.max || 0
          },
          unit: question.numericalAnswer?.unit || ''
        },
        feedback: {
          studentReports: [],
          teacherNotes: []
        },
        isActive: question.isActive !== false
      };
      
      setFormData(questionFormData);
    }
  }, [question, setFormData]);

  // Basic validation for step navigation
  const validateStep = (step: number): boolean => {
    // For now, allow navigation between steps
    // The useQuestionForm hook handles detailed validation
    return true;
  };

  // Update step validation
  useEffect(() => {
    const newStepValidation = [...stepValidation];
    newStepValidation[currentStep - 1] = validateStep(currentStep);
    setStepValidation(newStepValidation);
  }, [formData, currentStep]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field?: string,
    nestedField?: string,
    index?: number
  ) => {
    // Use the hook's handleInputChange function
    hookHandleInputChange(e, field, nestedField, index);
  };


  const handleFileUpload = (file: File | null, field: string, index?: number) => {
    // Use the hook's handleFileUpload function
    hookHandleFileUpload(file, field, index);
  };

  const handleCorrectOptionChange = (index: number) => {
    // Use the hook's handleCorrectOptionChange function
    hookHandleCorrectOptionChange(index);
  };

  const addOption = () => {
    hookAddOption();
  };

  const removeOption = (index: number) => {
    hookRemoveOption(index);
  };

  const addHint = () => {
    hookAddHint();
  };

  const removeHint = (index: number) => {
    hookRemoveHint(index);
  };

  const addCommonMistake = () => {
    hookAddCommonMistake();
  };

  const removeCommonMistake = (index: number) => {
    hookRemoveCommonMistake(index);
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>, field: 'tags' | 'relatedTopics' | 'prerequisites') => {
    hookHandleTagInput(e, field);
  };

  const removeTag = (index: number, field: 'tags' | 'relatedTopics' | 'prerequisites') => {
    hookRemoveTag(index, field);
  };

  const handleArrayField = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    // Use the hook's handleInputChange for array fields
    hookHandleInputChange(e, field);
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to previous steps or current step
    if (step <= currentStep) {
      setCurrentStep(step);
      return;
    }
    
    // For future steps, validate current step first
    if (validateStep(currentStep)) {
      setCurrentStep(step);
    } else {
      // Show error message if validation fails
      toast.error('Please complete the current step before proceeding');
    }
  };

  const handlePreview = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before previewing');
      return;
    }

    const updateData: any = {
        // Question structure that matches backend expectations
        question: {
          text: formData.question.text,
          image: formData.question.image?.file ? undefined : {
            url: formData.question.image?.url || '',
            publicId: formData.question.image?.publicId || ''
          }
        },
        // Options structure
        options: formData.options.map(opt => ({
          text: opt.text,
          image: opt.image?.file ? undefined : {
            url: opt.image?.url || '',
            publicId: opt.image?.publicId || ''
          }
        })),
        correctOptions: formData.correctOptions,
        // Solution structure
        solution: {
          text: formData.solution.text,
          image: formData.solution.image?.file ? undefined : {
            url: formData.solution.image?.url || '',
            publicId: formData.solution.image?.publicId || ''
          }
        },
        // Hints structure
        hints: formData.hints.map(hint => ({
          text: hint.text,
          image: hint.image?.file ? undefined : {
            url: hint.image?.url || '',
            publicId: hint.image?.publicId || ''
          }
        })),
        // Other fields
        questionType: formData.questionType, // Keep original values: 'single', 'multiple', 'numerical'
        questionCategory: formData.questionCategory,
        questionSource: formData.questionSource === 'india_book' || formData.questionSource === 'foreign_book' ? 'custom' : formData.questionSource,
        examType: formData.examType,
        class: formData.class,
        year: formData.year,
        subject: formData.subject,
        section: formData.section,
        chapter: formData.chapter,
        difficulty: formData.difficulty,
        language: formData.language,
        languageLevel: formData.languageLevel,
        marks: formData.marks,
        negativeMarks: formData.negativeMarks,
        commonMistakes: formData.commonMistakes.map(mistake => ({
          description: mistake.description || mistake,
          explanation: mistake.explanation || ''
        })),
        tags: formData.tags,
        relatedTopics: formData.relatedTopics,
        prerequisites: formData.prerequisites,
        // Add image files to updateData if they exist
        questionImage: formData.question.image?.file,
        solutionImage: formData.solution.image?.file,
        optionImages: formData.options.map(opt => opt.image?.file).filter(Boolean) as File[],
        hintImages: formData.hints.map(hint => hint.image?.file).filter(Boolean) as File[],
        // Numerical answer fields
        numericalAnswer: formData.numericalAnswer ? {
          exactValue: formData.numericalAnswer.exactValue,
          range: formData.numericalAnswer.range,
          unit: formData.numericalAnswer.unit
        } : undefined,
        conceptualDifficulty: formData.conceptualDifficulty,
        isVerified: formData.isVerified,
        isActive: formData.isActive
      };

    setPreviewData(updateData);
    setShowPreview(true);
  };

  const handleConfirmUpdate = async () => {
    if (!previewData) return;

    setIsSubmitting(true);
    try {
      const updatedQuestion = await updateQuestion(question._id, previewData);
      await updateQuestionInStore(question._id, previewData);
      onQuestionUpdate(updatedQuestion);
      
      setShowPreview(false);
      toast.success('Question updated successfully! You can continue editing or go back to questions list.');
      // Don't auto-redirect, let user choose
      // router.push('/admin/questions');
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  const handleResetForm = () => {
    if (confirm('Are you sure you want to reset the form? All changes will be lost.')) {
      clearFormData();
      setCurrentStep(1);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `question-${question._id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCancel = () => {
    router.push('/admin/questions');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Edit Question</h2>
          <p className="text-sm text-gray-500 mt-1">Fields marked with * are required</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleResetForm}
            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Form
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Step Indicators - Horizontal Tabs Style */}
      <div className="border-b border-gray-200 mb-6 bg-gray-50">
        <div className="px-6">
          <nav className="flex" aria-label="Form Steps">
        {STEPS.map((step, index) => (
            <button
                key={step.id}
              onClick={() => handleStepClick(step.id)}
                className={`relative flex items-center px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                  currentStep === step.id
                    ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-sm'
                } ${index === 0 ? 'rounded-tl-lg' : ''} ${index === STEPS.length - 1 ? 'rounded-tr-lg' : ''}`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-semibold transition-colors ${
                currentStep === step.id
                    ? 'bg-blue-500 text-white'
                  : stepValidation[index]
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
              {stepValidation[index] ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
                {currentStep === step.id && (
                  <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-blue-500"></div>
              )}
            </button>
            ))}
          </nav>
          </div>
      </div>

      {/* Form Content */}
      <div>
        {currentStep === 1 && (
          <QuestionContentStep
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

        {currentStep === 2 && (
          <DetailsClassificationStep
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleFileUpload={handleFileUpload}
            setErrors={setErrors}
          />
        )}

        {currentStep === 3 && (
          <SolutionHintsStep
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

        {currentStep === 4 && (
          <TagsTopicsStep
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
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={handlePreviousStep}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Next
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          ) : (
            <button
              onClick={handlePreview}
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
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <QuestionPreviewModal
          originalQuestion={question}
          updatedData={previewData}
          onConfirm={handleConfirmUpdate}
          onCancel={handleCancelPreview}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default QuestionEditForm; 