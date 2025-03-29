"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from 'react-dropzone';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  BookOpenIcon,
  BeakerIcon,
  LightBulbIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  PencilSquareIcon,
  CogIcon,
  DocumentIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  ArrowsPointingOutIcon,
  DocumentTextIcon,
  PlusIcon,
  MinusIcon,
  PaperClipIcon,
  BookmarkIcon
} from "@heroicons/react/24/outline";
import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import {
  setQuestionData,
  updateTempQuestionData,
  updateImageFiles,
  toggleSection,
  setError,
  setSuccess,
  resetChanges,
  clearNotifications,
  startLoading,
  stopLoading,
  startSaving,
  stopSaving
} from '@/redux/slices/questionSlice';

interface QuestionData {
  _id: string;
  author: {
    _id: string;
    email: string;
  };
  lastModifiedBy?: {
    _id: string;
    email: string;
  };
  revisionHistory: Array<{
    version: number;
    modifiedBy?: {
      _id: string;
      email: string;
    };
    changes: string;
    timestamp: string;
  }>;
  tags: string[];
  isVerified: boolean;
  verifiedBy?: {
    _id: string;
    email: string;
  };
  question: {
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  };
  questionType: 'single' | 'multiple' | 'numerical';
  options: Array<{
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  }>;
  correctOptions: number[];
  numericalAnswer?: {
    exactValue: number;
    range: {
      min: number;
      max: number;
    };
    unit: string;
  };
  commonMistakes: Array<{
    description: string;
    explanation: string;
  }>;
  statistics: {
    timesAttempted: number;
    successRate: number;
    averageTimeTaken: number;
  };
  examType: 'jee_main' | 'jee_adv' | 'cuet' | 'neet' | 'cbse_10' | 'cbse_12' | 'none';
  subject: string;
  chapter: string;
  sectionPhysics?: string;
  sectionChemistry?: string;
  sectionMathematics?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  conceptualDifficulty: number;
  year: string;
  languageLevel: 'basic' | 'intermediate' | 'advanced';
  language: 'english' | 'hindi';
  solution: {
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  };
  hints: Array<{
    text: string;
    image: {
      url: string;
      publicId: string;
    };
  }>;
  relatedTopics: string[];
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  isActive: boolean;
  feedback: {
    studentReports: Array<{
      type: 'error' | 'clarity' | 'difficulty' | 'other';
      description: string;
      reportedBy: {
        _id: string;
        email: string;
      };
      timestamp: string;
      status: 'pending' | 'reviewed' | 'resolved';
    }>;
    teacherNotes: Array<{
      note: string;
      addedBy: {
        _id: string;
        email: string;
      };
      timestamp: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

interface ImageFiles {
  questionImage?: File;
  solutionImage?: File;
  optionImages: (File | null)[];
  hintImages: (File | null)[];
}

interface ExpandedSections {
  question: boolean;
  options: boolean;
  solution: boolean;
  hints: boolean;
  commonMistakes: boolean;
  history: boolean;
}

interface FloatingLabelInputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  error?: string;
  placeholder?: string;
}

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  currentImage?: string;
  label: string;
}

interface ModernTextAreaProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}

const TABS = ['basic', 'advanced', 'metadata', 'feedback'] as const;
type TabId = typeof TABS[number];

interface TabData {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabsData: TabData[] = [
  { id: 'basic', label: 'Basic Info', icon: BookOpenIcon },
  { id: 'advanced', label: 'Advanced Settings', icon: AcademicCapIcon },
  { id: 'metadata', label: 'Metadata', icon: BeakerIcon },
  { id: 'feedback', label: 'Feedback & History', icon: ClockIcon }
];

interface TabButtonProps {
  id: TabId;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  onClick 
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={(e) => {
      e.preventDefault(); // Prevent form submission
      onClick();
    }}
    type="button" // Explicitly set type to button
    className={`
      flex items-center px-6 py-3 rounded-xl transition-all duration-200
      ${isActive 
        ? 'bg-green-100/80 text-green-800 font-medium shadow-sm backdrop-blur-sm' 
        : 'text-gray-600 hover:bg-gray-100/80 hover:backdrop-blur-sm'}
    `}
  >
    <Icon className="h-5 w-5 mr-2" />
    {label}
  </motion.button>
);

const FloatingLabelInput = React.memo(({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  className = "", 
  error = "",
  placeholder = ""
}: FloatingLabelInputProps) => (
  <div className="relative">
    <input
      type={type}
      value={value}
      onChange={(e) => {
        e.preventDefault(); // Prevent form submission
        e.stopPropagation();
        onChange(e);
      }}
      placeholder={placeholder}
      className={`
        peer h-14 w-full px-4 rounded-xl border-2 bg-white/80 backdrop-blur-sm
        transition-all duration-200 ease-in-out
        ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}
        focus:outline-none focus:ring-4 ${error ? 'focus:ring-red-100' : 'focus:ring-green-100'}
        ${className}
      `}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    />
    <label className={`
      absolute left-4 top-4 px-2 transition-all duration-200 ease-in-out
      peer-placeholder-shown:text-gray-400 peer-focus:text-sm
      peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-green-600
      peer-focus:bg-white peer-focus:px-2 peer-focus:font-medium
      text-sm ${error ? 'text-red-500' : 'text-gray-500'}
      peer-placeholder-shown:text-base peer-placeholder-shown:top-4
      ${value ? '-top-2.5 left-2 text-sm bg-white px-2 font-medium' : ''}
      ${value && !error ? 'text-green-600' : ''}
    `}>
      {label}
    </label>
    {error && (
      <p className="mt-1.5 text-xs text-red-500 ml-1">{error}</p>
    )}
  </div>
));

const ModernFileUpload = React.memo(({ 
  onFileSelect, 
  currentImage, 
  label 
}: FileUploadProps) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileChange(file);
    }
  }, []);

  const handleFileChange = useCallback((file: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  }, [handleFileChange]);

  return (
    <div className="w-full" onClick={handleClick}>
      <label className="text-sm text-gray-700 mb-1 block">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer border-2 border-dashed rounded-lg p-4
          ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-500'}
          transition-all duration-200 ease-in-out
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
        
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-32 object-contain rounded-md"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">
              Drag & drop an image or click to browse
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

const ModernTextArea = React.memo(({ 
  label, 
  value, 
  onChange, 
  placeholder = "", 
  rows = 3 
}: ModernTextAreaProps) => (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(e);
      }}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm
                 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none
                 transition-all duration-200 ease-in-out resize-none"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    />
  </div>
));

// Simple Toast component for notifications
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      <div className="flex items-center gap-2">
        {type === 'success' ? (
          <CheckCircleIcon className="w-5 h-5 text-green-500" />
        ) : (
          <XCircleIcon className="w-5 h-5 text-red-500" />
        )}
        <p className="font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="ml-2 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const EditQuestion = () => {
  const dispatch = useDispatch();
  const {
    questionData,
    tempQuestionData,
    imageFiles,
    expandedSections,
    unsavedChanges,
    success,
    error,
    isLoading,
    isSaving
  } = useSelector((state: RootState) => state.question);

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const router = useRouter();
  const params = useParams();
  const id = params?.questionId;

  // Use tempQuestionData for rendering, fallback to questionData, then to empty object if both are null
  const displayData = tempQuestionData || questionData || {
    updatedAt: new Date().toISOString(),
    isActive: false,
    isVerified: false,
    verifiedBy: null,
    questionType: '',
    question: { text: '', image: { url: '', publicId: '' } },
    solution: { text: '', image: { url: '', publicId: '' } },
    options: [],
    hints: [],
    statistics: {
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
      averageTime: 0
    },
    feedback: [],
    tags: [],
    subject: '',
    chapter: '',
    difficulty: '',
    marks: 0,
    negativeMarks: 0,
    expectedTime: 0
  };

  // Memoize the input change handler with useCallback
  const handleInputChange = useCallback((
    field: keyof QuestionData,
    value: any,
    nestedField?: string,
    index?: number
  ) => {
    // Create a synthetic event object for typing
    const e = typeof event !== 'undefined' ? event : { preventDefault: () => {}, stopPropagation: () => {} };
    e.preventDefault?.();
    e.stopPropagation?.();
    
    // Use requestAnimationFrame to defer the state update
    requestAnimationFrame(() => {
      dispatch(updateTempQuestionData({ field, value, nestedField, index }));
    });
  }, [dispatch]);

  // Memoize the image change handler
  const handleImageChange = useCallback((
    file: File | null,
    type: string,
    index?: number
  ) => {
    // Create a synthetic event object for typing
    const e = typeof event !== 'undefined' ? event : { preventDefault: () => {}, stopPropagation: () => {} };
    e.preventDefault?.();
    e.stopPropagation?.();
    
    // Use requestAnimationFrame to defer the state update
    requestAnimationFrame(() => {
      dispatch(updateImageFiles({ type, file, index }));
    });
  }, [dispatch]);

  // Handle section toggle
  const handleToggleSection = useCallback((section: keyof typeof expandedSections) => {
    // Create a synthetic event object for typing
    const e = typeof event !== 'undefined' ? event : { preventDefault: () => {}, stopPropagation: () => {} };
    e.preventDefault?.();
    e.stopPropagation?.();
    
    dispatch(toggleSection(section));
  }, [dispatch]);

  useEffect(() => {
    const fetchQuestion = async () => {
    if (!id) return;

      try {
        dispatch(startLoading());
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${id}`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch question');

        const data = await response.json();
        if (data.success) {
          dispatch(setQuestionData(data.data));
        } else {
          throw new Error(data.message || 'Failed to fetch question');
        }
      } catch (err) {
        dispatch(setError(err instanceof Error ? err.message : 'Failed to fetch question'));
      }
    };

    fetchQuestion();
  }, [id, dispatch]);

  // Handle submit with preventDefault
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!tempQuestionData) return;

    dispatch(startSaving());
    dispatch(clearNotifications());

    try {
      const formData = new FormData();
      
      const dataToSend = {
        ...tempQuestionData,
        question: { ...tempQuestionData.question, image: { url: '', publicId: '' } },
        solution: { ...tempQuestionData.solution, image: { url: '', publicId: '' } },
        options: tempQuestionData.options.map(opt => ({ ...opt, image: { url: '', publicId: '' } })),
        hints: tempQuestionData.hints.map(hint => ({ ...hint, image: { url: '', publicId: '' } }))
      };

      formData.append('data', JSON.stringify(dataToSend));
      
      if (imageFiles.questionImage) {
        formData.append('questionImage', imageFiles.questionImage);
      }
      if (imageFiles.solutionImage) {
        formData.append('solutionImage', imageFiles.solutionImage);
      }
      
      imageFiles.optionImages.forEach((file, index) => {
        if (file) {
          formData.append(`optionImages`, file);
          formData.append('optionImageIndexes', index.toString());
        }
      });

      imageFiles.hintImages.forEach((file, index) => {
        if (file) {
          formData.append(`hintImages`, file);
          formData.append('hintImageIndexes', index.toString());
        }
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update question');
      }

      if (data.data) {
        dispatch(setQuestionData(data.data));
        dispatch(setSuccess('Question updated successfully'));
      }
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to update question'));
    } finally {
      dispatch(stopSaving());
    }
  }, [tempQuestionData, imageFiles, id, dispatch]);

  // Update ModernFileUpload usage
  const handleFileSelect = useCallback((file: File | null, type: string, index?: number) => {
    // Create a synthetic event object for typing
    const e = typeof event !== 'undefined' ? event : { preventDefault: () => {}, stopPropagation: () => {} };
    e.preventDefault?.();
    e.stopPropagation?.();
    
    // Use requestAnimationFrame to defer the state update
    requestAnimationFrame(() => {
      handleImageChange(file, type, index);
    });
  }, [handleImageChange]);

  const handleCancelChanges = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (unsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        dispatch(resetChanges());
        dispatch(setSuccess('Changes discarded'));
      }
    } else {
      router.push('/admin/questions');
    }
  }, [unsavedChanges, dispatch, router]);

  // Use state to track if form was manually submitted
  const [manualSubmit, setManualSubmit] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Explicitly handle save button click separately from form submission
  const handleSaveButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tempQuestionData) return;
    
    setManualSubmit(true);
    
    // Use requestAnimationFrame to defer the state update
    requestAnimationFrame(() => {
      handleSubmit();
    });
  }, [tempQuestionData, handleSubmit]);

  // Handle form submission - completely prevent default
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only submit if the save button was explicitly clicked
    if (manualSubmit) {
      setManualSubmit(false);
      handleSubmit(e);
    }
  }, [manualSubmit, handleSubmit]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent Enter key from submitting the form
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  if (isLoading || !displayData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
      </div>
    );
  }

  const BasicInfoTab = ({ 
    questionData, 
    handleInputChange, 
    handleImageChange,
    expandedSections,
    toggleSection
  }: any) => (
    <div className="space-y-6">
      {/* Question Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('question')}
        >
          <h3 className="text-lg font-medium text-gray-900">Question Content</h3>
          {expandedSections.question ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        <AnimatePresence>
          {expandedSections.question && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-6"
            >
              <div>
                <FloatingLabelInput
                  label="Question Text"
                  value={questionData.question.text}
                  onChange={(e) => handleInputChange('question', e.target.value, 'text')}
                />
              </div>
              <div>
                <ModernFileUpload
                  onFileSelect={(file: File | null) => handleImageChange(file, 'question')}
                  currentImage={questionData.question.image.url}
                  label="Question Image"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Options or Numerical Answer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('options')}
        >
          <h3 className="text-lg font-medium text-gray-900">
            {questionData.questionType === 'numerical' ? 'Numerical Answer' : 'Options'}
          </h3>
          {expandedSections.options ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        {expandedSections.options && (
          <div className="p-4">
            {questionData.questionType === 'numerical' ? (
              <NumericalAnswerForm 
                questionData={questionData}
                handleInputChange={handleInputChange}
              />
            ) : (
              <OptionsForm 
                questionData={questionData}
                handleInputChange={handleInputChange}
                handleImageChange={handleImageChange}
              />
            )}
          </div>
        )}
      </motion.div>

      {/* Solution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div 
          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('solution')}
        >
          <h3 className="text-lg font-medium text-gray-900">Solution</h3>
          {expandedSections.solution ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </div>
        {expandedSections.solution && (
          <div className="p-4 space-y-4">
          <div>
              <FloatingLabelInput
                label="Solution Text"
                value={questionData.solution.text}
                onChange={(e) => handleInputChange('solution', e.target.value, 'text')}
              />
            </div>
            <div>
              <ModernFileUpload
                onFileSelect={(file: File | null) => handleImageChange(file, 'solution')}
                currentImage={questionData.solution.image.url}
                label="Solution Image"
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  const AdvancedSettingsTab = ({ questionData, handleInputChange, handleImageChange }: any) => (
    <div className="space-y-6">
      {/* Hints */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border-2 border-gray-100 p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hints</h3>
        <div className="space-y-4">
          {questionData.hints.map((hint: any, index: number) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border-2 border-gray-100 bg-white/90"
            >
              <ModernTextArea
                label={`Hint ${index + 1}`}
                value={hint.text}
                onChange={(e) => handleInputChange('hints', e.target.value, 'text', index)}
                placeholder={`Enter hint ${index + 1}`}
              />
              <div className="mt-4">
                <ModernFileUpload
                  onFileSelect={(file: File | null) => handleFileSelect(file, 'hint', index)}
                  currentImage={hint.image.url}
                  label={`Hint ${index + 1} Image`}
                />
              </div>
            </motion.div>
          ))}
          {questionData.hints.length < 3 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleInputChange('hints', [...questionData.hints, { text: '', image: { url: '', publicId: '' } }]);
              }}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-green-200 text-green-600 
                       hover:bg-green-50/50 hover:border-green-300 transition-all duration-200 flex items-center justify-center"
            >
              <LightBulbIcon className="w-5 h-5 mr-2" />
              Add Hint
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Common Mistakes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border-2 border-gray-100 p-6"
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">Common Mistakes</h3>
        <div className="space-y-4">
          {questionData.commonMistakes.map((mistake: any, index: number) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border-2 border-gray-100 bg-white/90 space-y-4"
            >
              <ModernTextArea
                label="Description"
                value={mistake.description}
                onChange={(e) => handleInputChange('commonMistakes', e.target.value, 'description', index)}
                placeholder="Describe the common mistake"
                rows={2}
              />
              <ModernTextArea
                label="Explanation"
                value={mistake.explanation}
                onChange={(e) => handleInputChange('commonMistakes', e.target.value, 'explanation', index)}
                placeholder="Explain why this is incorrect and how to avoid it"
                rows={3}
              />
            </motion.div>
          ))}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleInputChange('commonMistakes', [...questionData.commonMistakes, { description: '', explanation: '' }]);
            }}
            className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-green-200 text-green-600 
                     hover:bg-green-50/50 hover:border-green-300 transition-all duration-200 flex items-center justify-center"
          >
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            Add Common Mistake
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  const MetadataTab = ({ questionData, handleInputChange }: any) => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tags and Topics</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <input 
              type="text" 
              value={questionData.tags.join(', ')}
              onChange={(e) => handleInputChange('tags', e.target.value.split(',').map((tag: string) => tag.trim()))}
              className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter tags separated by commas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Related Topics</label>
            <input
              type="text"
              value={questionData.relatedTopics.join(', ')}
              onChange={(e) => handleInputChange('relatedTopics', e.target.value.split(',').map((topic: string) => topic.trim()))}
              className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter related topics separated by commas"
            />
          </div>
        </div>
          </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Prerequisites</h3>
          <div>
              <input 
                type="text" 
            value={questionData.prerequisites.join(', ')}
            onChange={(e) => handleInputChange('prerequisites', e.target.value.split(',').map((prereq: string) => prereq.trim()))}
            className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500"
            placeholder="Enter prerequisites separated by commas"
          />
          </div>
      </div>
    </div>
  );

  const FeedbackHistoryTab = ({ questionData }: any) => (
    <div className="space-y-6">
      {/* Revision History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Revision History</h3>
        <div className="space-y-4">
          {questionData.revisionHistory.map((revision: any, index: number) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-green-800">v{revision.version}</span>
                </div>
              </div>
          <div>
                <p className="text-sm text-gray-900">{revision.changes}</p>
                <div className="mt-1 text-xs text-gray-500">
                  <span>{new Date(revision.timestamp).toLocaleString()}</span>
                  {revision.modifiedBy && (
                    <span className="ml-2">by {revision.modifiedBy.email}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Reports */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Student Reports</h3>
        <div className="space-y-4">
          {questionData.feedback.studentReports.map((report: any, index: number) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {report.status}
                </span>
                <span className="text-xs text-gray-500">{new Date(report.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm text-gray-900">{report.description}</p>
              <p className="mt-1 text-xs text-gray-500">Reported by: {report.reportedBy.email}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Teacher Notes</h3>
        <div className="space-y-4">
          {questionData.feedback.teacherNotes.map((note: any, index: number) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-900">{note.note}</p>
              <div className="mt-2 text-xs text-gray-500">
                <span>{new Date(note.timestamp).toLocaleString()}</span>
                <span className="ml-2">by {note.addedBy.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const QuickInfoPanel = ({ questionData, handleInputChange }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempData, setTempData] = useState({
      questionType: questionData.questionType,
      subject: questionData.subject,
      chapter: questionData.chapter,
      difficulty: questionData.difficulty,
      marks: questionData.marks
    });

    const handleTempChange = (field: string, value: any) => {
      setTempData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = (e: React.MouseEvent) => {
      e.preventDefault();
      // Apply all changes at once
      Object.entries(tempData).forEach(([field, value]) => {
        handleInputChange(field as keyof QuestionData, value);
      });
      setIsEditing(false);
    };

    const handleCancel = (e: React.MouseEvent) => {
      e.preventDefault();
      // Reset to original values
      setTempData({
        questionType: questionData.questionType,
        subject: questionData.subject,
        chapter: questionData.chapter,
        difficulty: questionData.difficulty,
        marks: questionData.marks
      });
      setIsEditing(false);
    };

    useEffect(() => {
      // Update temp data when questionData changes
      setTempData({
        questionType: questionData.questionType,
        subject: questionData.subject,
        chapter: questionData.chapter,
        difficulty: questionData.difficulty,
        marks: questionData.marks
      });
    }, [questionData]);

    const questionTypes = ['single', 'multiple', 'numerical'];
    const subjects = ['physics', 'chemistry', 'mathematics', 'biology'];
    const difficulties = ['easy', 'medium', 'hard'];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-gray-900">Quick Info</h3>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-all duration-200"
                >
                  Save
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsEditing(true);
                }}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
              >
                Edit
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Question Type */}
          <div className="p-2 bg-gray-50/50 rounded-lg backdrop-blur-sm">
            <span className="text-xs text-gray-500 block mb-1">Question Type</span>
            {isEditing ? (
              <select
                value={tempData.questionType}
                onChange={(e) => handleTempChange('questionType', e.target.value)}
                className="w-full text-sm px-2 py-1 bg-white rounded-md border border-gray-200
                         focus:border-green-500 focus:ring-1 focus:ring-green-100 focus:outline-none"
              >
                {questionTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-medium block">
                {questionData.questionType}
              </span>
            )}
          </div>

          {/* Subject */}
          <div className="p-2 bg-gray-50/50 rounded-lg backdrop-blur-sm">
            <span className="text-xs text-gray-500 block mb-1">Subject</span>
            {isEditing ? (
              <select
                value={tempData.subject}
                onChange={(e) => handleTempChange('subject', e.target.value)}
                className="w-full text-sm px-2 py-1 bg-white rounded-md border border-gray-200
                         focus:border-green-500 focus:ring-1 focus:ring-green-100 focus:outline-none"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject.charAt(0).toUpperCase() + subject.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-medium block">
                {questionData.subject}
              </span>
            )}
          </div>

          {/* Chapter */}
          <div className="p-2 bg-gray-50/50 rounded-lg backdrop-blur-sm">
            <span className="text-xs text-gray-500 block mb-1">Chapter</span>
            {isEditing ? (
              <input
                type="text"
                value={tempData.chapter}
                onChange={(e) => handleTempChange('chapter', e.target.value)}
                className="w-full text-sm px-2 py-1 bg-white rounded-md border border-gray-200
                         focus:border-green-500 focus:ring-1 focus:ring-green-100 focus:outline-none"
                placeholder="Enter chapter"
              />
            ) : (
              <span className="text-sm font-medium block">
                {questionData.chapter}
              </span>
            )}
          </div>

          {/* Difficulty */}
          <div className="p-2 bg-gray-50/50 rounded-lg backdrop-blur-sm">
            <span className="text-xs text-gray-500 block mb-1">Difficulty</span>
            {isEditing ? (
              <select
                value={tempData.difficulty}
                onChange={(e) => handleTempChange('difficulty', e.target.value)}
                className={`w-full text-sm px-2 py-1 rounded-md border ${
                  tempData.difficulty === 'easy' ? 'bg-green-50 text-green-800 border-green-200' :
                  tempData.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                  'bg-red-50 text-red-800 border-red-200'
                } focus:ring-1 focus:ring-green-100 focus:outline-none`}
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`text-sm font-medium block px-2 py-1 rounded-md ${
                questionData.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                questionData.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {questionData.difficulty}
              </span>
            )}
          </div>

          {/* Marks */}
          <div className="p-2 bg-gray-50/50 rounded-lg backdrop-blur-sm col-span-2">
            <span className="text-xs text-gray-500 block mb-1">Marks</span>
            {isEditing ? (
            <input 
              type="number" 
                value={tempData.marks}
                onChange={(e) => handleTempChange('marks', parseInt(e.target.value))}
              min="0" 
                className="w-full text-sm px-2 py-1 bg-white rounded-md border border-gray-200
                         focus:border-green-500 focus:ring-1 focus:ring-green-100 focus:outline-none"
            />
            ) : (
              <span className="text-sm font-medium block">
                {questionData.marks}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const StatisticsPanel = ({ statistics }: any) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
      <div className="grid grid-cols-1 gap-3">
        <div className="p-4 bg-gray-50/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Times Attempted</span>
            <span className="text-lg font-semibold text-gray-900">{statistics.timesAttempted}</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500" 
              style={{ width: `${Math.min(100, (statistics.timesAttempted / 100) * 100)}%` }}
            />
          </div>
        </div>
        <div className="p-4 bg-gray-50/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Success Rate</span>
            <span className="text-lg font-semibold text-gray-900">{statistics.successRate}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500" 
              style={{ width: `${statistics.successRate}%` }}
            />
          </div>
        </div>
        <div className="p-4 bg-gray-50/50 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Avg. Time Taken</span>
            <span className="text-lg font-semibold text-gray-900">{statistics.averageTimeTaken}s</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500" 
              style={{ width: `${Math.min(100, (statistics.averageTimeTaken / 300) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const VerificationPanel = ({ isVerified, verifiedBy, verificationDate }: any) => (
    <div className={`p-4 rounded-xl backdrop-blur-sm ${
      isVerified ? 'bg-green-50/50' : 'bg-yellow-50/50'
    }`}>
      <div className="flex items-center space-x-3">
        {isVerified ? (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          </div>
        )}
        <div>
          <h3 className="text-lg font-medium">
            {isVerified ? 'Verified' : 'Pending Verification'}
          </h3>
          {isVerified && verifiedBy && (
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-600 flex items-center">
                <AcademicCapIcon className="w-4 h-4 mr-1" />
                Verified by: {verifiedBy.email}
              </p>
              <p className="text-sm text-gray-600 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Date: {new Date(verificationDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const NumericalAnswerForm = ({ questionData, handleInputChange }: any) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <FloatingLabelInput
            label="Exact Value"
            value={questionData.numericalAnswer?.exactValue || 0}
            onChange={(e) => handleInputChange('numericalAnswer', parseFloat(e.target.value), 'exactValue')}
            type="number"
          />
        </div>
        <div>
          <FloatingLabelInput
            label="Range Min"
            value={questionData.numericalAnswer?.range.min || 0}
            onChange={(e) => handleInputChange('numericalAnswer', {
              ...questionData.numericalAnswer,
              range: {
                ...questionData.numericalAnswer.range,
                min: parseFloat(e.target.value)
              }
            })}
            type="number"
          />
        </div>
        <div>
          <FloatingLabelInput
            label="Range Max"
            value={questionData.numericalAnswer?.range.max || 0}
            onChange={(e) => handleInputChange('numericalAnswer', {
              ...questionData.numericalAnswer,
              range: {
                ...questionData.numericalAnswer.range,
                max: parseFloat(e.target.value)
              }
            })}
            type="number"
          />
        </div>
      </div>
      <div>
        <FloatingLabelInput
          label="Unit"
          value={questionData.numericalAnswer?.unit || ''}
          onChange={(e) => handleInputChange('numericalAnswer', e.target.value, 'unit')}
          placeholder="e.g., m/s², kg, N"
        />
      </div>
    </div>
  );

  const OptionsForm = ({ questionData, handleInputChange, handleImageChange }: any) => (
    <div className="space-y-4">
      {questionData.options.map((option: any, index: number) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-3 rounded-lg border border-gray-100 bg-white/80 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <input
                type={questionData.questionType === 'single' ? 'radio' : 'checkbox'}
                checked={questionData.correctOptions.includes(index)}
                onChange={(e) => {
                  const newCorrectOptions = questionData.questionType === 'single'
                    ? [index]
                    : e.target.checked
                      ? [...questionData.correctOptions, index]
                      : questionData.correctOptions.filter((i: number) => i !== index);
                  handleInputChange('correctOptions', newCorrectOptions);
                }}
                className="h-4 w-4 text-green-600 focus:ring-green-500 rounded-full border border-gray-300
                           checked:border-green-500 transition-all duration-200"
              />
              <span className="text-sm font-medium text-gray-900">
                Option {String.fromCharCode(65 + index)}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              questionData.correctOptions.includes(index)
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {questionData.correctOptions.includes(index) ? 'Correct' : 'Incorrect'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                type="text"
                value={option.text}
                onChange={(e) => handleInputChange('options', e.target.value, 'text', index)}
                placeholder={`Enter option ${String.fromCharCode(65 + index)} text`}
                className="w-full text-sm px-3 py-2 bg-white rounded-md border border-gray-200
                         focus:border-green-500 focus:ring-1 focus:ring-green-100 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <ModernFileUpload
                onFileSelect={(file: File | null) => handleImageChange(file, 'option', index)}
                currentImage={option.image.url}
                label={`Option ${String.fromCharCode(65 + index)} Image`}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Use React.memo for child components
  const MemoizedBasicInfoTab = React.memo(BasicInfoTab);
  const MemoizedAdvancedSettingsTab = React.memo(AdvancedSettingsTab);
  const MemoizedMetadataTab = React.memo(MetadataTab);
  const MemoizedFeedbackHistoryTab = React.memo(FeedbackHistoryTab);
  const MemoizedQuickInfoPanel = React.memo(QuickInfoPanel);
  const MemoizedStatisticsPanel = React.memo(StatisticsPanel);
  const MemoizedVerificationPanel = React.memo(VerificationPanel);

  return (
    <form 
      ref={formRef}
      onSubmit={handleFormSubmit}
      onKeyDown={handleKeyDown}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-8 mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Edit Question
              </h1>
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                Last modified: {new Date(displayData.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancelChanges();
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white/80 backdrop-blur-sm 
                           border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-all duration-200"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                // Use type="button" and explicit handler instead of submit
                type="button"
                disabled={isSaving}
                onClick={handleSaveButtonClick}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 
                           rounded-xl hover:from-green-700 hover:to-emerald-700 shadow-sm disabled:opacity-50 
                           transition-all duration-200 hover:shadow-lg"
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : 'Save Changes'}
              </motion.button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-3 mt-6">
            <motion.span
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm backdrop-blur-sm
                ${displayData.isActive 
                  ? 'bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white' 
                  : 'bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white'}`}
            >
              {displayData.isActive ? 'Active' : 'Inactive'}
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm backdrop-blur-sm
                ${displayData.isVerified
                  ? 'bg-gradient-to-r from-blue-500/90 to-sky-500/90 text-white'
                  : 'bg-gradient-to-r from-yellow-500/90 to-amber-500/90 text-white'}`}
            >
              {displayData.isVerified ? 'Verified' : 'Unverified'}
            </motion.span>
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500/90 to-violet-500/90 text-white shadow-sm backdrop-blur-sm"
            >
              {displayData.questionType.charAt(0).toUpperCase() + displayData.questionType.slice(1)}
            </motion.span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 mt-8 bg-gray-50/50 p-1.5 rounded-xl backdrop-blur-sm">
            {tabsData.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6"
              >
                {activeTab === 'basic' && (
                  <MemoizedBasicInfoTab 
                    questionData={displayData} 
                    handleInputChange={handleInputChange} 
                    handleImageChange={handleImageChange}
                    expandedSections={expandedSections}
                    toggleSection={handleToggleSection}
                  />
                )}
                {activeTab === 'advanced' && (
                  <MemoizedAdvancedSettingsTab 
                    questionData={displayData} 
                    handleInputChange={handleInputChange} 
                    handleImageChange={handleImageChange}
                  />
                )}
                {activeTab === 'metadata' && (
                  <MemoizedMetadataTab 
                    questionData={displayData} 
                    handleInputChange={handleInputChange} 
                  />
                )}
                {activeTab === 'feedback' && (
                  <MemoizedFeedbackHistoryTab 
                    questionData={displayData} 
                  />
                )}
              </motion.div>
            </div>
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6"
              >
                <MemoizedQuickInfoPanel questionData={displayData} handleInputChange={handleInputChange} />
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />
                <MemoizedStatisticsPanel statistics={displayData.statistics} />
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />
                <MemoizedVerificationPanel 
                  isVerified={displayData.isVerified}
                  verifiedBy={displayData.verifiedBy}
                  verificationDate={displayData.updatedAt}
                />
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Success/Error Notifications */}
        <AnimatePresence>
          {(success || error) && (
            <Toast 
              message={success || error || ''} 
              type={success ? 'success' : 'error'} 
              onClose={() => {
                dispatch(setSuccess(null));
                dispatch(setError(null));
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

// Memoize the entire EditQuestion component
export default React.memo(EditQuestion);
