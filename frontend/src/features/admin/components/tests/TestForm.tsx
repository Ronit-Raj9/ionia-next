"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  ClockIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useTestStore } from '../../store/testStore';
import type { Test, CreateTestData, UpdateTestData, Question } from '../../types';
import LoadingSpinner from '../analytics/LoadingSpinner';

interface TestFormProps {
  testId?: string;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  title: string;
  description: string;
  testCategory: 'PYQ' | 'Platform' | 'UserCustom';
  status: 'draft' | 'published' | 'archived';
  instructions: string;
  solutionsVisibility: 'always' | 'after_completion' | 'never';
  attemptsAllowed: number;
  duration: number;
  subject: string;
  examType: string;
  class: string;
  difficulty: 'easy' | 'medium' | 'hard';
  year?: number;
  month?: string;
  day?: number;
  session?: string;
  platformTestType?: string;
  isPremium?: boolean;
  syllabus?: string[];
  isPublic?: boolean;
  tags: string[];
  questions: string[];
  markingScheme: {
    correct: number;
    incorrect: number;
    unattempted: number;
  };
}

const TestForm: React.FC<TestFormProps> = ({
  testId,
  mode,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const router = useRouter();
  const {
    selectedTest,
    loading,
    error,
    fetchTestById,
    createTest,
    updateTest,
    clearError,
    isCreating,
    isUpdating
  } = useTestStore();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    testCategory: 'Platform',
    status: 'draft',
    instructions: '',
    solutionsVisibility: 'after_completion',
    attemptsAllowed: 1,
    duration: 180,
    subject: '',
    examType: '',
    class: '',
    difficulty: 'medium',
    tags: [],
    questions: [],
    markingScheme: {
      correct: 4,
      incorrect: -1,
      unattempted: 0
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [questionSearch, setQuestionSearch] = useState('');
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (mode === 'edit' && testId) {
      fetchTestById(testId);
    }
    // Load questions for selection
    fetchQuestions();
  }, [mode, testId]);

  useEffect(() => {
    if (mode === 'edit' && selectedTest) {
      populateFormWithTest(selectedTest);
    }
  }, [selectedTest, mode]);

  const populateFormWithTest = (test: Test) => {
    setFormData({
      title: test.title,
      description: test.description || '',
      testCategory: test.testCategory,
      status: test.status,
      instructions: test.instructions || '',
      solutionsVisibility: test.solutionsVisibility,
      attemptsAllowed: test.attemptsAllowed,
      duration: test.duration,
      subject: test.subject,
      examType: test.examType,
      class: test.class,
      difficulty: test.difficulty,
      year: test.year,
      month: test.month,
      day: test.day,
      session: test.session,
      platformTestType: test.platformTestType,
      isPremium: test.isPremium,
      syllabus: test.syllabus || [],
      isPublic: test.isPublic,
      tags: test.tags || [],
      questions: test.questions || [],
      markingScheme: test.markingScheme || {
        correct: 4,
        incorrect: -1,
        unattempted: 0
      }
    });

    // Load selected questions
    if (test.questions && test.questions.length > 0) {
      const testQuestions = questions.filter(q => test.questions.includes(q._id));
      setSelectedQuestions(testQuestions);
    }
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

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      updateFormField('tags', [...formData.tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    updateFormField('tags', formData.tags.filter(t => t !== tag));
  };

  const addQuestion = (question: Question) => {
    if (!selectedQuestions.find(q => q._id === question._id)) {
      const newSelected = [...selectedQuestions, question];
      setSelectedQuestions(newSelected);
      updateFormField('questions', newSelected.map(q => q._id));
    }
  };

  const removeQuestion = (questionId: string) => {
    const newSelected = selectedQuestions.filter(q => q._id !== questionId);
    setSelectedQuestions(newSelected);
    updateFormField('questions', newSelected.map(q => q._id));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
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

    if (formData.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    if (formData.questions.length === 0) {
      newErrors.questions = 'At least one question must be selected';
    }

    if (formData.testCategory === 'PYQ' && !formData.year) {
      newErrors.year = 'Year is required for PYQ tests';
    }

    if (formData.testCategory === 'Platform' && !formData.platformTestType) {
      newErrors.platformTestType = 'Platform test type is required';
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
      const testData: CreateTestData | UpdateTestData = {
        ...formData,
        changesDescription: mode === 'edit' ? 'Test updated via admin interface' : undefined
      };

      if (mode === 'create') {
        await createTest(testData as CreateTestData);
      } else if (testId) {
        await updateTest(testId, testData as UpdateTestData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/tests');
      }
    } catch (err) {
      console.error('Failed to save test:', err);
    }
  };

  const isLoading = loading || isCreating || isUpdating;
  const submitError = error;

  const filteredQuestions = questions.filter(q =>
    q.question.text.toLowerCase().includes(questionSearch.toLowerCase()) ||
    q.subject.toLowerCase().includes(questionSearch.toLowerCase()) ||
    q.examType.toLowerCase().includes(questionSearch.toLowerCase())
  );

  if (mode === 'edit' && loading) {
    return <LoadingSpinner message="Loading test details..." />;
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Create New Test' : 'Edit Test'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Fill in the details below to {mode === 'create' ? 'create' : 'update'} the test
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
                  mode === 'create' ? 'Create Test' : 'Update Test'
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
                  Error {mode === 'create' ? 'creating' : 'updating'} test
                </h3>
                <div className="mt-2 text-sm text-red-700">{submitError}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Enter test title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormField('description', e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="Enter test description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Category *
                  </label>
                  <select
                    value={formData.testCategory}
                    onChange={(e) => updateFormField('testCategory', e.target.value as FormData['testCategory'])}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="Platform">Platform Test</option>
                    <option value="PYQ">Previous Year Questions</option>
                    <option value="UserCustom">Custom Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => updateFormField('status', e.target.value as FormData['status'])}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
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
              </div>
            </div>

            {/* Test Configuration */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-gray-400" />
                Test Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => updateFormField('duration', parseInt(e.target.value) || 180)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attempts Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.attemptsAllowed}
                    onChange={(e) => updateFormField('attemptsAllowed', parseInt(e.target.value) || 1)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solutions Visibility
                  </label>
                  <select
                    value={formData.solutionsVisibility}
                    onChange={(e) => updateFormField('solutionsVisibility', e.target.value as FormData['solutionsVisibility'])}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  >
                    <option value="never">Never</option>
                    <option value="after_completion">After Completion</option>
                    <option value="always">Always</option>
                  </select>
                </div>
              </div>

              {/* Marking Scheme */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Marking Scheme</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.markingScheme.correct}
                      onChange={(e) => updateFormField('markingScheme', {
                        ...formData.markingScheme,
                        correct: parseFloat(e.target.value) || 0
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incorrect Answer
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.markingScheme.incorrect}
                      onChange={(e) => updateFormField('markingScheme', {
                        ...formData.markingScheme,
                        incorrect: parseFloat(e.target.value) || 0
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unattempted
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.markingScheme.unattempted}
                      onChange={(e) => updateFormField('markingScheme', {
                        ...formData.markingScheme,
                        unattempted: parseFloat(e.target.value) || 0
                      })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category-specific fields */}
            {formData.testCategory === 'PYQ' && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Previous Year Question Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year *
                    </label>
                    <input
                      type="number"
                      min="2000"
                      max="2030"
                      value={formData.year || ''}
                      onChange={(e) => updateFormField('year', parseInt(e.target.value) || undefined)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                    {errors.year && (
                      <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={formData.month || ''}
                      onChange={(e) => updateFormField('month', e.target.value || undefined)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Select Month</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.day || ''}
                      onChange={(e) => updateFormField('day', parseInt(e.target.value) || undefined)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session
                    </label>
                    <select
                      value={formData.session || ''}
                      onChange={(e) => updateFormField('session', e.target.value || undefined)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Select Session</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formData.testCategory === 'Platform' && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Platform Test Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Test Type *
                    </label>
                    <select
                      value={formData.platformTestType || ''}
                      onChange={(e) => updateFormField('platformTestType', e.target.value || undefined)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="">Select Type</option>
                      <option value="mock">Mock Test</option>
                      <option value="practice">Practice Test</option>
                      <option value="assignment">Assignment</option>
                      <option value="chapter-test">Chapter Test</option>
                    </select>
                    {errors.platformTestType && (
                      <p className="mt-1 text-sm text-red-600">{errors.platformTestType}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPremium || false}
                        onChange={(e) => updateFormField('isPremium', e.target.checked)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Premium Test
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Question Selection */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <QuestionMarkCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                Questions ({selectedQuestions.length})
              </h3>
              
              <button
                type="button"
                onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Questions
              </button>

              {errors.questions && (
                <p className="mt-2 text-sm text-red-600">{errors.questions}</p>
              )}

              {showQuestionSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 border-t pt-4"
                >
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="Search questions..."
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredQuestions.slice(0, 20).map((question) => (
                      <div
                        key={question._id}
                        className="flex items-start justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate" title={question.question.text}>
                            {question.question.text}
                          </p>
                          <p className="text-xs text-gray-500">
                            {question.subject} • {question.examType} • {question.marks} marks
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addQuestion(question)}
                          disabled={selectedQuestions.find(q => q._id === question._id) !== undefined}
                          className="ml-2 p-1 text-emerald-600 hover:text-emerald-800 disabled:text-gray-400"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Selected Questions */}
              {selectedQuestions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Selected Questions</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedQuestions.map((question, index) => (
                      <div
                        key={question._id}
                        className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-md"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {index + 1}. {question.question.text.substring(0, 50)}...
                          </p>
                          <p className="text-xs text-gray-500">
                            {question.marks} marks • {question.difficulty}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(question._id)}
                          className="ml-2 p-1 text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    Total: {selectedQuestions.length} questions, {selectedQuestions.reduce((sum, q) => sum + q.marks, 0)} marks
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
              
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-emerald-600 hover:text-emerald-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TestForm;