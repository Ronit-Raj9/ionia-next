"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { useQuestionStore } from '../../store/questionStore';
import type { Question, CreateQuestionData, UpdateQuestionData } from '../../types';
import LoadingSpinner from '../analytics/LoadingSpinner';

interface QuestionFormProps {
  questionId?: string;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  questionText: string;
  questionType: 'mcq' | 'numerical' | 'assertion';
  subject: string;
  chapter: string;
  examType: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  solutionText: string;
  language: string;
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  questionCategory: 'theoretical' | 'numerical' | 'conceptual';
  questionSource: 'pyq' | 'custom' | 'platform';
  section: string;
  year: string;
  options: string[];
  correctOptions: number[];
  exactValue: number | null;
  rangeMin: number | null;
  rangeMax: number | null;
  unit: string;
  tags: string[];
  prerequisites: string[];
  commonMistakes: string[];
  conceptualDifficulty: number;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  questionId,
  mode,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const router = useRouter();
  const {
    selectedQuestion,
    loading,
    error,
    fetchQuestionById,
    createQuestion,
    updateQuestion,
    clearError
  } = useQuestionStore();

  const [formData, setFormData] = useState<FormData>({
    questionText: '',
    questionType: 'mcq',
    subject: '',
    chapter: '',
    examType: '',
    class: '',
    difficulty: 'medium',
    marks: 1,
    negativeMarks: 0,
    solutionText: '',
    language: 'english',
    languageLevel: 'intermediate',
    questionCategory: 'theoretical',
    questionSource: 'custom',
    section: '',
    year: '',
    options: ['', '', '', ''],
    correctOptions: [],
    exactValue: null,
    rangeMin: null,
    rangeMax: null,
    unit: '',
    tags: [],
    prerequisites: [],
    commonMistakes: [],
    conceptualDifficulty: 5
  });

  const [files, setFiles] = useState<{
    questionImage?: File;
    solutionImage?: File;
    optionImages: (File | null)[];
  }>({
    optionImages: [null, null, null, null]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (mode === 'edit' && questionId) {
      fetchQuestionById(questionId);
    }
  }, [mode, questionId]);

  useEffect(() => {
    if (mode === 'edit' && selectedQuestion) {
      populateFormWithQuestion(selectedQuestion);
    }
  }, [selectedQuestion, mode]);

  const populateFormWithQuestion = (question: Question) => {
    setFormData({
      questionText: question.question.text || '',
      questionType: question.questionType,
      subject: question.subject,
      chapter: question.chapter,
      examType: question.examType,
      class: question.class,
      difficulty: question.difficulty,
      marks: question.marks,
      negativeMarks: question.negativeMarks || 0,
      solutionText: question.solution.text || '',
      language: question.language,
      languageLevel: question.languageLevel,
      questionCategory: question.questionCategory,
      questionSource: question.questionSource,
      section: question.section || '',
      year: question.year || '',
      options: question.options?.map(opt => opt.text) || ['', '', '', ''],
      correctOptions: question.correctOptions || [],
      exactValue: question.numericalAnswer?.exactValue || null,
      rangeMin: question.numericalAnswer?.range.min || null,
      rangeMax: question.numericalAnswer?.range.max || null,
      unit: question.numericalAnswer?.unit || '',
      tags: question.tags || [],
      prerequisites: question.prerequisites || [],
      commonMistakes: question.commonMistakes || [],
      conceptualDifficulty: question.conceptualDifficulty || 5
    });
  };

  const updateFormField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    updateFormField('options', newOptions);
  };

  const toggleCorrectOption = (index: number) => {
    const newCorrectOptions = formData.correctOptions.includes(index)
      ? formData.correctOptions.filter(i => i !== index)
      : [...formData.correctOptions, index];
    updateFormField('correctOptions', newCorrectOptions);
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      updateFormField('tags', [...formData.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    updateFormField('tags', formData.tags.filter(t => t !== tag));
  };

  const handleFileChange = (field: keyof typeof files, file: File | null, index?: number) => {
    setFiles(prev => {
      if (field === 'optionImages' && typeof index === 'number') {
        const newOptionImages = [...prev.optionImages];
        newOptionImages[index] = file;
        return { ...prev, optionImages: newOptionImages };
      }
      return { ...prev, [field]: file };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.examType) {
      newErrors.examType = 'Exam type is required';
    }

    if (!formData.class) {
      newErrors.class = 'Class is required';
    }

    if (formData.marks <= 0) {
      newErrors.marks = 'Marks must be greater than 0';
    }

    if (formData.questionType === 'mcq') {
      if (formData.options.some(opt => !opt.trim())) {
        newErrors.options = 'All options must be filled';
      }
      if (formData.correctOptions.length === 0) {
        newErrors.correctOptions = 'At least one correct option must be selected';
      }
    }

    if (formData.questionType === 'numerical') {
      if (formData.exactValue === null && (formData.rangeMin === null || formData.rangeMax === null)) {
        newErrors.numerical = 'Either exact value or range must be provided';
      }
      if (formData.rangeMin !== null && formData.rangeMax !== null && formData.rangeMin >= formData.rangeMax) {
        newErrors.numerical = 'Range minimum must be less than maximum';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const questionData: CreateQuestionData | UpdateQuestionData = {
        ...formData,
        exactValue: formData.exactValue ?? undefined,
        rangeMin: formData.rangeMin ?? undefined,
        rangeMax: formData.rangeMax ?? undefined,
        questionImage: files.questionImage,
        solutionImage: files.solutionImage,
        optionImages: files.optionImages.filter(f => f !== null) as File[]
      };

      if (mode === 'create') {
        await createQuestion(questionData as CreateQuestionData);
      } else if (questionId) {
        await updateQuestion(questionId, questionData as UpdateQuestionData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/questions');
      }
    } catch (err) {
      console.error('Failed to save question:', err);
    }
  };

  const isLoading = loading;
  const submitError = error;

  if (mode === 'edit' && loading) {
    return <LoadingSpinner message="Loading question details..." />;
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Create New Question' : 'Edit Question'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Fill in the details below to {mode === 'create' ? 'create' : 'update'} the question
              </p>
            </div>
            
            <div className="flex space-x-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'create' ? 'Create Question' : 'Update Question'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error {mode === 'create' ? 'creating' : 'updating'} question
                </h3>
                <div className="mt-2 text-sm text-red-700">{submitError}</div>
              </div>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Text *
              </label>
              <textarea
                value={formData.questionText}
                onChange={(e) => updateFormField('questionText', e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Enter the question text..."
              />
              {errors.questionText && (
                <p className="mt-1 text-sm text-red-600">{errors.questionText}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type *
              </label>
              <select
                value={formData.questionType}
                onChange={(e) => updateFormField('questionType', e.target.value as FormData['questionType'])}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="numerical">Numerical</option>
                <option value="assertion">Assertion</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => updateFormField('subject', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">Select Subject</option>
                <option value="physics">Physics</option>
                <option value="chemistry">Chemistry</option>
                <option value="mathematics">Mathematics</option>
                <option value="biology">Biology</option>
                <option value="english">English</option>
              </select>
              {errors.subject && (
                <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter
              </label>
              <input
                type="text"
                value={formData.chapter}
                onChange={(e) => updateFormField('chapter', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Enter chapter name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type *
              </label>
              <select
                value={formData.examType}
                onChange={(e) => updateFormField('examType', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">Select Exam Type</option>
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="NEET">NEET</option>
                <option value="CBSE">CBSE</option>
                <option value="State Board">State Board</option>
              </select>
              {errors.examType && (
                <p className="mt-1 text-sm text-red-600">{errors.examType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                value={formData.class}
                onChange={(e) => updateFormField('class', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">Select Class</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
                <option value="11-12">Class 11-12</option>
                <option value="Dropper">Dropper</option>
              </select>
              {errors.class && (
                <p className="mt-1 text-sm text-red-600">{errors.class}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty *
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => updateFormField('difficulty', e.target.value as FormData['difficulty'])}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marks *
              </label>
              <input
                type="number"
                min="1"
                value={formData.marks}
                onChange={(e) => updateFormField('marks', parseInt(e.target.value) || 1)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
              {errors.marks && (
                <p className="mt-1 text-sm text-red-600">{errors.marks}</p>
              )}
            </div>
          </div>
        </div>

        {/* Question Options (MCQ) */}
        {formData.questionType === 'mcq' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <QuestionMarkCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
              Options
            </h3>
            
            <div className="space-y-4">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.correctOptions.includes(index)}
                    onChange={() => toggleCorrectOption(index)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    title="Mark as correct"
                  />
                  <span className="text-sm font-medium text-gray-700 w-8">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleFileChange('optionImages', null, index)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Add image"
                  >
                    <PhotoIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            
            {errors.options && (
              <p className="mt-2 text-sm text-red-600">{errors.options}</p>
            )}
            {errors.correctOptions && (
              <p className="mt-2 text-sm text-red-600">{errors.correctOptions}</p>
            )}
          </div>
        )}

        {/* Numerical Answer */}
        {formData.questionType === 'numerical' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Numerical Answer
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exact Value
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.exactValue || ''}
                  onChange={(e) => updateFormField('exactValue', parseFloat(e.target.value) || null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Exact answer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Range Min
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.rangeMin || ''}
                  onChange={(e) => updateFormField('rangeMin', parseFloat(e.target.value) || null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Minimum value"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Range Max
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.rangeMax || ''}
                  onChange={(e) => updateFormField('rangeMax', parseFloat(e.target.value) || null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Maximum value"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => updateFormField('unit', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="e.g., m/s, kg, °C"
              />
            </div>
            
            {errors.numerical && (
              <p className="mt-2 text-sm text-red-600">{errors.numerical}</p>
            )}
          </div>
        )}

        {/* Solution */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Solution
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Solution Text
            </label>
            <textarea
              value={formData.solutionText}
              onChange={(e) => updateFormField('solutionText', e.target.value)}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Enter the solution explanation..."
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;