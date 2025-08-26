"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, Download } from "lucide-react";
import { Question, UpdateQuestionData } from "@/features/admin/types";
import { updateQuestion } from "@/features/admin/api/questionApi";
import { useQuestionStore } from "@/features/admin/store/questionStore";

// Form step components
import QuestionContentStep from "./steps/QuestionContent";
import DetailsClassificationStep from "./steps/DetailsClassification";
import SolutionHintsStep from "./steps/SolutionHints";
import TagsTopicsStep from "./steps/TagsTopics";

interface QuestionEditFormProps {
  question: Question;
  onQuestionUpdate: (updatedQuestion: Question) => void;
}

interface FormData {
  // Question Content
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'assertion';
  questionCategory: 'theoretical' | 'numerical' | 'conceptual';
  questionSource: 'pyq' | 'custom' | 'platform';
  options: Array<{
    text: string;
    image?: File | null;
    isCorrect: boolean;
  }>;
  questionImage?: File | null;

  // Details & Classification
  examType: string;
  class: string;
  year: string;
  subject: string;
  section: string;
  chapter: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  conceptualDifficulty: number;

  // Solution & Hints
  solutionText: string;
  solutionImage?: File | null;
  hints: Array<{
    text: string;
    image?: File | null;
  }>;
  commonMistakes: Array<{
    description: string;
  }>;

  // Tags & Topics
  tags: string[];
  relatedTopics: string[];
  prerequisites: string[];

  // Numerical specific
  exactValue?: number;
  rangeMin?: number;
  rangeMax?: number;
  unit?: string;
}

const STEPS = [
  { id: 1, title: "Question Content", description: "Define the question and options" },
  { id: 2, title: "Details & Classification", description: "Set metadata and classification" },
  { id: 3, title: "Solution & Hints", description: "Add solution and helpful hints" },
  { id: 4, title: "Tags & Topics", description: "Add tags and related topics" }
];

const QuestionEditForm: React.FC<QuestionEditFormProps> = ({ question, onQuestionUpdate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    questionText: '',
    questionType: 'mcq',
    questionCategory: 'theoretical',
    questionSource: 'custom',
    options: [
      { text: '', image: null, isCorrect: false },
      { text: '', image: null, isCorrect: false },
      { text: '', image: null, isCorrect: false },
      { text: '', image: null, isCorrect: false }
    ],
    examType: '',
    class: '',
    year: 'not applicable',
    subject: '',
    section: '',
    chapter: '',
    difficulty: 'medium',
    language: 'english',
    languageLevel: 'basic',
    marks: 1,
    negativeMarks: 0,
    expectedTime: 60,
    conceptualDifficulty: 5,
    solutionText: '',
    solutionImage: null,
    hints: [],
    commonMistakes: [],
    tags: [],
    relatedTopics: [],
    prerequisites: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepValidation, setStepValidation] = useState([false, false, false, false]);
  
  const router = useRouter();
  const { updateQuestion: updateQuestionInStore } = useQuestionStore();

  // Initialize form data from question
  useEffect(() => {
    if (question) {
      setFormData({
        questionText: question.question?.text || '',
        questionType: question.questionType || 'mcq',
        questionCategory: question.questionCategory || 'theoretical',
        questionSource: question.questionSource || 'custom',
        options: question.options?.map(opt => ({
          text: opt.text || '',
          image: null,
          isCorrect: question.correctOptions?.includes(question.options?.indexOf(opt) || 0) || false
        })) || [
          { text: '', image: null, isCorrect: false },
          { text: '', image: null, isCorrect: false },
          { text: '', image: null, isCorrect: false },
          { text: '', image: null, isCorrect: false }
        ],
        examType: question.examType || '',
        class: question.class || '',
        year: question.year || 'not applicable',
        subject: question.subject || '',
        section: question.section || '',
        chapter: question.chapter || '',
        difficulty: question.difficulty || 'medium',
        language: question.language || 'english',
        languageLevel: question.languageLevel || 'basic',
        marks: question.marks || 1,
        negativeMarks: question.negativeMarks || 0,
        expectedTime: 60, // Default value since it's not in the type
        conceptualDifficulty: question.conceptualDifficulty || 5,
        solutionText: question.solution?.text || '',
        solutionImage: null,
        hints: question.hints?.map(hint => ({
          text: hint.text || '',
          image: null
        })) || [],
        commonMistakes: question.commonMistakes?.map(mistake => ({
          description: mistake
        })) || [],
        tags: question.tags || [],
        relatedTopics: [], // Not in the type, using empty array
        prerequisites: question.prerequisites || []
      });
    }
  }, [question]);

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.questionText.trim()) {
          newErrors.questionText = 'Question text is required';
        }
        if (formData.questionType === 'mcq') {
          const validOptions = formData.options.filter(opt => opt.text.trim());
          if (validOptions.length < 2) {
            newErrors.options = 'At least 2 options are required';
          }
          const correctOptions = formData.options.filter(opt => opt.isCorrect);
          if (correctOptions.length === 0) {
            newErrors.correctOption = 'At least one correct option is required';
          }
        }
        break;
      case 2:
        if (!formData.examType) {
          newErrors.examType = 'Exam type is required';
        }
        if (!formData.subject) {
          newErrors.subject = 'Subject is required';
        }
        if (!formData.class) {
          newErrors.class = 'Class is required';
        }
        break;
      case 3:
        if (!formData.solutionText.trim()) {
          newErrors.solutionText = 'Solution text is required';
        }
        break;
      case 4:
        if (formData.tags.length === 0) {
          newErrors.tags = 'At least one tag is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update step validation
  useEffect(() => {
    const newStepValidation = [...stepValidation];
    newStepValidation[currentStep - 1] = validateStep(currentStep);
    setStepValidation(newStepValidation);
  }, [formData, currentStep]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const handleCorrectOptionChange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => ({
        ...option,
        isCorrect: i === index
      }))
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', image: null, isCorrect: false }]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const handleFileUpload = (file: File | null, field: string, index?: number) => {
    if (index !== undefined) {
      handleOptionChange(index, field, file);
    } else {
      handleInputChange(field, file);
    }
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

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: UpdateQuestionData = {
        questionText: formData.questionText,
        questionType: formData.questionType,
        questionCategory: formData.questionCategory,
        questionSource: formData.questionSource,
        options: formData.options.map(opt => opt.text),
        correctOptions: formData.options.map((opt, index) => opt.isCorrect ? index : -1).filter(index => index !== -1),
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
        solutionText: formData.solutionText,
        hint0Text: formData.hints[0]?.text || '',
        hint1Text: formData.hints[1]?.text || '',
        hint2Text: formData.hints[2]?.text || '',
        commonMistakes: formData.commonMistakes.map(mistake => mistake.description),
        tags: formData.tags,
        prerequisites: formData.prerequisites
      };

      const updatedQuestion = await updateQuestion(question._id, updateData);
      await updateQuestionInStore(question._id, updateData);
      onQuestionUpdate(updatedQuestion);
      
      toast.success('Question updated successfully');
      router.push('/admin/questions');
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    if (confirm('Are you sure you want to reset the form? All changes will be lost.')) {
      setFormData({
        questionText: '',
        questionType: 'mcq',
        questionCategory: 'theoretical',
        questionSource: 'custom',
        options: [
          { text: '', image: null, isCorrect: false },
          { text: '', image: null, isCorrect: false },
          { text: '', image: null, isCorrect: false },
          { text: '', image: null, isCorrect: false }
        ],
        examType: '',
        class: '',
        year: 'not applicable',
        subject: '',
        section: '',
        chapter: '',
        difficulty: 'medium',
        language: 'english',
        languageLevel: 'basic',
        marks: 1,
        negativeMarks: 0,
        expectedTime: 60,
        conceptualDifficulty: 5,
        solutionText: '',
        solutionImage: null,
        hints: [],
        commonMistakes: [],
        tags: [],
        relatedTopics: [],
        prerequisites: []
      });
      setErrors({});
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

      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => handleStepClick(step.id)}
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                currentStep === step.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : stepValidation[index]
                  ? 'bg-green-100 border-green-500 text-green-600 hover:bg-green-200'
                  : 'bg-red-100 border-red-500 text-red-600 hover:bg-red-200'
              }`}
              aria-label={`Go to step ${step.id}: ${step.title}`}
            >
              {stepValidation[index] ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => handleStepClick(step.id)}
              className="ml-3 text-left hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label={`Go to step ${step.id}: ${step.title}`}
            >
              <p className={`text-sm font-medium transition-colors ${
                currentStep === step.id ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}>
                {step.id}. {step.title}
              </p>
              <p className="text-xs text-gray-400 transition-colors hover:text-gray-500">{step.description}</p>
            </button>
            {index < STEPS.length - 1 && (
              <div className="mx-4 w-8 h-0.5 bg-gray-300"></div>
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div>
        {currentStep === 1 && (
          <QuestionContentStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onOptionChange={handleOptionChange}
            onCorrectOptionChange={handleCorrectOptionChange}
            onFileUpload={handleFileUpload}
            onAddOption={addOption}
            onRemoveOption={removeOption}
          />
        )}

        {currentStep === 2 && (
          <DetailsClassificationStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        )}

        {currentStep === 3 && (
          <SolutionHintsStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onFileUpload={handleFileUpload}
          />
        )}

        {currentStep === 4 && (
          <TagsTopicsStep
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
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
              onClick={handleSubmit}
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
    </div>
  );
};

export default QuestionEditForm; 