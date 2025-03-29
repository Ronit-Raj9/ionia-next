"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import axios from 'axios';
import {
  PlusCircle, 
  MinusCircle, 
  CheckCircle, 
  ChevronRight,
  ChevronLeft, 
  Save,
  Upload, 
  X, 
  Search,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
  Lightbulb
} from 'lucide-react';

// Define constants for form selections
const EXAM_TYPES = [
  { value: 'jee_main', label: 'JEE Main' },
  { value: 'jee_adv', label: 'JEE Advanced' },
  { value: 'cuet', label: 'CUET' },
  { value: 'neet', label: 'NEET' },
  { value: 'cbse_11', label: 'CBSE Class 11' },
  { value: 'cbse_12', label: 'CBSE Class 12' },
  { value: 'none', label: 'None/Other' }
];

const SUBJECTS = [
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'biology', label: 'Biology' },
  { value: 'english', label: 'English' },
  { value: 'general_test', label: 'General Test' }
];

const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'very-hard', label: 'Very Hard' }
];

const LANGUAGE_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'telugu', label: 'Telugu' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'gujarati', label: 'Gujarati' }
];

const QUESTION_TYPES = [
  { value: 'single', label: 'Single Choice' },
  { value: 'multiple', label: 'Multiple Choice' },
  { value: 'numerical', label: 'Numerical' }
];

const QUESTION_CATEGORIES = [
  { value: 'theoretical', label: 'Theoretical' },
  { value: 'numerical', label: 'Numerical' }
];

const QUESTION_SOURCES = [
  { value: 'custom', label: 'Custom' },
  { value: 'india_book', label: 'Indian Book' },
  { value: 'foreign_book', label: 'Foreign Book' },
  { value: 'pyq', label: 'Previous Year Question' }
];

// Class options
const CLASS_OPTIONS = [
  { value: 'class_9', label: 'Class 9' },
  { value: 'class_10', label: 'Class 10' },
  { value: 'class_11', label: 'Class 11' },
  { value: 'class_12', label: 'Class 12' },
  { value: 'none', label: 'None/Other' }
];

// Years for questions (past to current)
const YEARS = Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => String(1990 + i));

// Physics Sections
const PHYSICS_SECTIONS = [
  { value: 'mechanics', label: 'Mechanics' },
  { value: 'electromagnetism', label: 'Electromagnetism' },
  { value: 'thermodynamics', label: 'Thermodynamics' },
  { value: 'optics', label: 'Optics' },
  { value: 'modern_physics', label: 'Modern Physics' },
  { value: 'none', label: 'None' }
];

// Chemistry Sections
const CHEMISTRY_SECTIONS = [
  { value: 'organic', label: 'Organic Chemistry' },
  { value: 'inorganic', label: 'Inorganic Chemistry' },
  { value: 'physical', label: 'Physical Chemistry' },
  { value: 'analytical', label: 'Analytical Chemistry' },
  { value: 'none', label: 'None' }
];

// Mathematics Sections
const MATHEMATICS_SECTIONS = [
  { value: 'algebra', label: 'Algebra' },
  { value: 'calculus', label: 'Calculus' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'statistics', label: 'Statistics' },
  { value: 'trigonometry', label: 'Trigonometry' },
  { value: 'none', label: 'None' }
];

// General Test Sections
const GENERAL_TEST_SECTIONS = [
  { value: 'gk', label: 'General Knowledge' },
  { value: 'current_affairs', label: 'Current Affairs' },
  { value: 'general_science', label: 'General Science' },
  { value: 'mathematical_reasoning', label: 'Mathematical Reasoning' },
  { value: 'logical_reasoning', label: 'Logical Reasoning' },
  { value: 'none', label: 'None' }
];

// English Sections
const ENGLISH_SECTIONS = [
  { value: 'reading_comprehension', label: 'Reading Comprehension' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'writing', label: 'Writing' },
  { value: 'none', label: 'None' }
];

// Biology Sections
const BIOLOGY_SECTIONS = [
  { value: 'botany', label: 'Botany' },
  { value: 'zoology', label: 'Zoology' },
  { value: 'human_physiology', label: 'Human Physiology' },
  { value: 'ecology', label: 'Ecology' },
  { value: 'genetics', label: 'Genetics' },
  { value: 'none', label: 'None' }
];

// Form steps
const FORM_STEPS = [
  { title: 'Question Content', icon: <PlusCircle size={14} /> },
  { title: 'Details & Classification', icon: <AlertCircle size={14} /> },
  { title: 'Solution & Hints', icon: <Lightbulb size={14} /> },
  { title: 'Tags & Topics', icon: <Save size={14} /> }
];

// Interfaces for type safety
interface Option {
  text: string;
  image: File | null;
}

interface Hint {
  text: string;
  image: File | null;
}

interface CommonMistake {
  description: string;
  explanation: string;
}

interface NumericalAnswer {
  exactValue: number;
  range: {
    min: number;
    max: number;
  };
  unit: string;
}

interface QuestionFormData {
  question: string;
  questionImage: File | null;
  options: Option[];
  correctOptions: number[];
  questionType: string;
  questionCategory: string;
  questionSource: string;
  examType: string;
  class: string;
  subject: string;
  chapter: string;
  section: string;
  difficulty: string;
  tags: string[];
  solution: string;
  solutionImage: File | null;
  hints: Hint[];
  relatedTopics: string[];
  commonMistakes: CommonMistake[];
  prerequisites: string[];
  language: string;
  languageLevel: string;
  year: string;
  marks: number;
  negativeMarks: number;
  expectedTime: number;
  numericalAnswer: NumericalAnswer;
  isVerified: boolean;
  conceptualDifficulty: number;
  feedback: {
    studentReports: StudentReport[];
    teacherNotes: TeacherNote[];
  };
}

interface StudentReport {
  type: 'error' | 'clarity' | 'difficulty' | 'other';
  description: {
    text: string;
    image: File | null;
  };
  reportedBy?: string;
  timestamp?: {
    created: Date;
    lastModified: Date;
  };
  status: 'pending' | 'reviewed' | 'resolved';
}

interface TeacherNote {
  note: {
    text: string;
    image: File | null;
  };
  addedBy?: string;
  timestamp?: {
    created: Date;
    lastModified: Date;
  };
}

// Helper Components
interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove }) => {
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    if (!file) return;
    
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="relative mt-2 inline-block">
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-24 w-24 relative">
        <Image 
          src={preview} 
          alt="Preview" 
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  label: string;
  initialFile?: File | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, label, initialFile }) => {
  const [file, setFile] = useState<File | null>(initialFile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onFileSelect(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    onFileSelect(null as unknown as File); // Pass null to parent
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      </div>
      
      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors"
        >
          <Upload className="mx-auto h-6 w-6 text-gray-400" />
          <p className="mt-1 text-sm text-gray-500">Click to upload an image</p>
          <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 5MB</p>
        </div>
      ) : (
        <ImagePreview file={file} onRemove={handleRemoveFile} />
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default function AddQuestion() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  
  // Initialize form state with all required fields
  const [formData, setFormData] = useState<QuestionFormData>({
    question: "",
    questionImage: null,
    options: [
      { text: "", image: null },
      { text: "", image: null },
      { text: "", image: null }, 
      { text: "", image: null }
    ],
    correctOptions: [],
    questionType: "single",
    questionCategory: "theoretical",
    questionSource: "custom",
    examType: "",
    class: "",
    subject: "",
    chapter: "",
    section: "",
    difficulty: "medium",
    year: "not applicable",
    languageLevel: "intermediate",
    language: "english",
    solution: "",
    solutionImage: null,
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
      range: {
        min: 0,
        max: 0
      },
      unit: ""
    },
    feedback: {
      studentReports: [],
      teacherNotes: []
    }
  });

  // Autosave functionality
  useEffect(() => {
    const autosaveData = () => {
      // Don't save file objects in localStorage
      const dataToSave = { ...formData };
      // Set file objects to null instead of using delete
      dataToSave.questionImage = null;
      dataToSave.solutionImage = null;
      dataToSave.options = dataToSave.options.map(opt => ({ ...opt, image: null }));
      dataToSave.hints = dataToSave.hints.map(hint => ({ ...hint, image: null }));
      
      localStorage.setItem('questionDraft', JSON.stringify(dataToSave));
    };

    const timeoutId = setTimeout(autosaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('questionDraft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      // Ensure the structure matches our current state
      setFormData(prevData => ({
        ...prevData,
        ...parsedDraft,
        questionImage: null,
        solutionImage: null,
        options: parsedDraft.options?.map((opt: any) => ({ ...opt, image: null })) || prevData.options,
        hints: parsedDraft.hints?.map((hint: any) => ({ ...hint, image: null })) || prevData.hints
      }));
    }
  }, []);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, 
    field?: string,
    nestedField?: string,
    index?: number
  ) => {
    // Clear error for this field
    if (field) setErrors(prev => ({ ...prev, [field]: '' }));
    
    const { name, value } = e.target;
    const fieldName = field || name;
    
    setFormData(prev => {
      // Create a deep copy to avoid mutation
      const newState = { ...prev };
      
      if (index !== undefined && nestedField) {
        // Handle nested array fields like options[0].text
        if (fieldName === 'options') {
          const newOptions = [...prev.options];
          newOptions[index] = { ...newOptions[index], [nestedField]: value };
          newState.options = newOptions;
        } else if (fieldName === 'hints') {
          const newHints = [...prev.hints];
          newHints[index] = { ...newHints[index], [nestedField]: value };
          newState.hints = newHints;
        } else if (fieldName === 'commonMistakes') {
          const newMistakes = [...prev.commonMistakes];
          newMistakes[index] = { ...newMistakes[index], [nestedField]: value };
          newState.commonMistakes = newMistakes;
        }
      } else if (nestedField && fieldName === 'numericalAnswer') {
        // Handle nested object like numericalAnswer.exactValue
        const numericalAnswer = { ...prev.numericalAnswer! };
        
        if (nestedField === 'range') {
          // Handle range object
          numericalAnswer.range = { 
            ...numericalAnswer.range,
            ...(typeof value === 'object' ? value : {})
          };
        } else if (nestedField === 'exactValue') {
          // Handle exact value (number)
          numericalAnswer.exactValue = parseFloat(value as string);
        } else {
          // Handle other properties
          (numericalAnswer as any)[nestedField] = value;
        }
        
        newState.numericalAnswer = numericalAnswer;
      } else if (nestedField && fieldName === 'numericalAnswer.range') {
        // Handle doubly nested like numericalAnswer.range.min
        const numericalAnswer = { ...prev.numericalAnswer! };
        numericalAnswer.range = {
          ...numericalAnswer.range,
          [nestedField]: parseFloat(value as string)
        };
        newState.numericalAnswer = numericalAnswer;
      } else {
        // Handle simple fields
        (newState as any)[fieldName] = value;
      }
      
      return newState;
    });
    
    setIsSaved(false);
  };

  // Handle file upload
  const handleFileUpload = (file: File | null, field: string, index?: number) => {
    setFormData(prev => {
      if (field === 'questionImage') {
        return { ...prev, questionImage: file };
      } else if (field === 'solutionImage') {
        return { ...prev, solutionImage: file };
      } else if (field === 'optionImage' && index !== undefined) {
        const newOptions = [...prev.options];
        newOptions[index] = { ...newOptions[index], image: file };
        return { ...prev, options: newOptions };
      } else if (field === 'hintImage' && index !== undefined) {
        const newHints = [...prev.hints];
        newHints[index] = { ...newHints[index], image: file };
        return { ...prev, hints: newHints };
      }
      return prev;
    });
    
    setIsSaved(false);
  };
  
  // Handle correct option selection
  const handleCorrectOptionChange = (index: number) => {
    setFormData(prev => {
      // For single choice, replace the array with just this index
      if (prev.questionType === 'single') {
        return { ...prev, correctOptions: [index] };
      }
      
      // For multiple choice, toggle the index
      const newCorrectOptions = [...prev.correctOptions];
      const existingIndex = newCorrectOptions.indexOf(index);
      
      if (existingIndex >= 0) {
        newCorrectOptions.splice(existingIndex, 1);
      } else {
        newCorrectOptions.push(index);
      }
      
      return { ...prev, correctOptions: newCorrectOptions };
    });
    
    setIsSaved(false);
    
    // Clear error for correctOptions
    setErrors(prev => ({ ...prev, correctOptions: '' }));
  };
  
  // Handle arrays like tags, prerequisites, etc.
  const handleArrayField = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: value }));
    
    setIsSaved(false);
  };
  
  // Add/remove options
  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', image: null }]
    }));
    
    setIsSaved(false);
  };
  
  const removeOption = (index: number) => {
    setFormData(prev => {
      const newOptions = [...prev.options];
      newOptions.splice(index, 1);
      
      // Update correctOptions if needed
      const newCorrectOptions = prev.correctOptions
        .filter(i => i !== index)
        .map(i => (i > index ? i - 1 : i));
      
      return {
        ...prev,
        options: newOptions,
        correctOptions: newCorrectOptions
      };
    });
    
    setIsSaved(false);
  };
  
  // Add/remove hints
  const addHint = () => {
    if (formData.hints.length < 4) {
      setFormData(prev => ({
        ...prev,
        hints: [...prev.hints, { text: '', image: null }]
      }));
      
      setIsSaved(false);
    }
  };

  const removeHint = (index: number) => {
    setFormData(prev => {
      const newHints = [...prev.hints];
      newHints.splice(index, 1);
      return { ...prev, hints: newHints };
    });
    
    setIsSaved(false);
  };
  
  // Add/remove common mistakes
  const addCommonMistake = () => {
    setFormData(prev => ({
      ...prev,
      commonMistakes: [...prev.commonMistakes, { description: '', explanation: '' }]
    }));
    
    setIsSaved(false);
  };

  const removeCommonMistake = (index: number) => {
    setFormData(prev => {
      const newMistakes = [...prev.commonMistakes];
      newMistakes.splice(index, 1);
      return { ...prev, commonMistakes: newMistakes };
    });
    
    setIsSaved(false);
  };
  
  // Get subject sections based on subject
  const getSubjectSections = () => {
    switch (formData.subject.toLowerCase()) {
      case 'physics':
        return PHYSICS_SECTIONS;
      case 'chemistry':
        return CHEMISTRY_SECTIONS;
      case 'mathematics':
        return MATHEMATICS_SECTIONS;
      case 'general_test':
        return GENERAL_TEST_SECTIONS;
      case 'english':
        return ENGLISH_SECTIONS;
      case 'biology':
        return BIOLOGY_SECTIONS;
      default:
        return [];
    }
  };
  
  // Validate form based on current step
  const validateForm = (currentStep: number) => {
    const errors: Record<string, string> = {};
    
    if (currentStep === 1) {
      // Question text/image is required
      if (!formData.question.trim() && !formData.questionImage) {
        errors.question = "Either question text or image is required";
      }
      
      // For multiple choice questions
      if (formData.questionType !== 'numerical') {
        // Check if we have at least 2 options
        if (formData.options.length < 2) {
          errors.options = "At least 2 options are required";
        } else {
          // Check if all options have content
          const emptyOptions = formData.options.some(
            (option, index) => !option.text.trim() && !option.image
          );
          if (emptyOptions) {
            errors.options = "All options must have either text or image content";
          }
        }
        
        // Check if at least one correct option is selected
        if (formData.correctOptions.length === 0) {
          errors.correctOptions = "At least one correct option must be selected";
        }
        
        // For multiple choice, allow multiple correct options
        // For single choice, only one correct option is allowed
        if (formData.questionType === 'single' && formData.correctOptions.length > 1) {
          errors.correctOptions = "Only one correct option is allowed for single choice questions";
        }
      } else {
        // Numerical question validation
        if (formData.numericalAnswer.exactValue === undefined) {
          errors['numericalAnswer.exactValue'] = "Exact value is required";
        }
        
        if (formData.numericalAnswer.range.min === undefined || 
            formData.numericalAnswer.range.max === undefined) {
          errors['numericalAnswer.range'] = "Both minimum and maximum range are required";
        } else if (formData.numericalAnswer.range.min >= formData.numericalAnswer.range.max) {
          errors['numericalAnswer.range'] = "Maximum range must be greater than minimum range";
        }
        
        // Check if exact value is within range
        const { exactValue, range } = formData.numericalAnswer;
        if (exactValue !== undefined && range.min !== undefined && range.max !== undefined) {
          if (exactValue < range.min || exactValue > range.max) {
            errors['numericalAnswer.exactValue'] = "Exact value must be within the specified range";
          }
        }
      }
      
      // Add validation for questionCategory and questionSource
      if (!formData.questionCategory) {
        errors.questionCategory = "Question category is required";
      }
      if (!formData.questionSource) {
        errors.questionSource = "Question source is required";
      }
      
      // For PYQ questions, year is required
      if (formData.questionSource === 'pyq' && formData.year === 'not applicable') {
        errors.year = "Year is required for previous year questions";
      }
    } else if (currentStep === 2) {
      // Subject and classification validation
      if (!formData.examType) {
        errors.examType = "Exam type is required";
      }
      
      if (!formData.class) {
        errors.class = "Class is required";
      }
      
      if (!formData.subject) {
        errors.subject = "Subject is required";
      }
      
      if (!formData.chapter.trim()) {
        errors.chapter = "Chapter is required";
      }
      
      // Section validation based on subject
      if (['physics', 'chemistry', 'mathematics', 'general_test', 'english', 'biology'].includes(formData.subject.toLowerCase())) {
        if (!formData.section) {
          errors.section = `Section is required for ${formData.subject}`;
        }
      }
      
      if (!formData.difficulty) {
        errors.difficulty = "Difficulty is required";
      }
      
      if (!formData.language) {
        errors.language = "Language is required";
      }
      
      if (!formData.languageLevel) {
        errors.languageLevel = "Language level is required";
      }
      
      if (formData.marks <= 0) {
        errors.marks = "Marks must be greater than 0";
      }
      
      // Validate that negative marks are not positive
      if (formData.negativeMarks > 0) {
        errors.negativeMarks = "Negative marks cannot be positive";
      }
    } else if (currentStep === 3) {
      // Solution validation
      if (!formData.solution.trim() && !formData.solutionImage) {
        errors.solution = "Either solution text or image is required";
      }
      
      // Hints are optional, but if added, they must have content
      formData.hints.forEach((hint, index) => {
        if (!hint.text.trim() && !hint.image) {
          errors[`hints[${index}]`] = "Hint must have either text or image content";
        }
      });
      
      // Common mistakes are optional, but if added, they must have content
      formData.commonMistakes.forEach((mistake, index) => {
        if (!mistake.description.trim()) {
          errors[`commonMistakes[${index}].description`] = "Description is required";
        }
        if (!mistake.explanation.trim()) {
          errors[`commonMistakes[${index}].explanation`] = "Explanation is required";
        }
      });
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form data:", formData);
    
    // Validate all steps before submission
    for (let i = 1; i <= 4; i++) {
      const validationErrors = validateForm(i);
      if (Object.keys(validationErrors).length > 0) {
        setStep(i);
        setErrors(validationErrors);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Prepare form data for submission
      const formDataToSubmit = new FormData();
      
      // Add basic fields
      formDataToSubmit.append("questionText", formData.question);
      formDataToSubmit.append("questionType", formData.questionType);
      formDataToSubmit.append("questionCategory", formData.questionCategory);
      formDataToSubmit.append("questionSource", formData.questionSource);
      formDataToSubmit.append("examType", formData.examType);
      formDataToSubmit.append("class", formData.class);
      formDataToSubmit.append("subject", formData.subject);
      formDataToSubmit.append("chapter", formData.chapter);
      formDataToSubmit.append("section", formData.section);
      formDataToSubmit.append("difficulty", formData.difficulty);
      formDataToSubmit.append("marks", formData.marks.toString());
      formDataToSubmit.append("negativeMarks", formData.negativeMarks.toString());
      formDataToSubmit.append("expectedTime", formData.expectedTime.toString());
      formDataToSubmit.append("language", formData.language);
      formDataToSubmit.append("languageLevel", formData.languageLevel);
      formDataToSubmit.append("year", formData.year);
      formDataToSubmit.append("conceptualDifficulty", formData.conceptualDifficulty.toString());
      
      // Add arrays as JSON strings
      formDataToSubmit.append("tags", JSON.stringify(formData.tags));
      formDataToSubmit.append("relatedTopics", JSON.stringify(formData.relatedTopics));
      formDataToSubmit.append("prerequisites", JSON.stringify(formData.prerequisites));
      formDataToSubmit.append("commonMistakes", JSON.stringify(formData.commonMistakes));
      
      // Add question and solution images
      if (formData.questionImage) {
        formDataToSubmit.append("questionImage", formData.questionImage);
      }
      if (formData.solutionImage) {
        formDataToSubmit.append("solutionImage", formData.solutionImage);
      }
      
      // Add option images with index-based naming
      formData.options.forEach((option, index) => {
        if (option.image) {
          formDataToSubmit.append(`option${index}Image`, option.image);
        }
      });
      
      // Add hint text and images with index-based naming
      formData.hints.forEach((hint, index) => {
        if (hint.text) {
          formDataToSubmit.append(`hint${index}Text`, hint.text);
        }
        if (hint.image) {
          formDataToSubmit.append(`hint${index}Image`, hint.image);
        }
      });
      
      // Add type-specific data
      if (formData.questionType === 'numerical') {
        formDataToSubmit.append("exactValue", formData.numericalAnswer.exactValue.toString());
        formDataToSubmit.append("rangeMin", formData.numericalAnswer.range.min.toString());
        formDataToSubmit.append("rangeMax", formData.numericalAnswer.range.max.toString());
        formDataToSubmit.append("unit", formData.numericalAnswer.unit || "");
      } else {
        // For multiple choice questions
        const optionsTexts = formData.options.map(opt => opt.text);
        formDataToSubmit.append("options", JSON.stringify(optionsTexts));
        formDataToSubmit.append("correctOptions", JSON.stringify(formData.correctOptions));
      }
      
      // Make API request
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/upload`, {
        method: "POST",
        body: formDataToSubmit,
        credentials: "include"
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setIsSaved(true);
        localStorage.removeItem('questionDraft');
        toast.success('Question created successfully!');
        setTimeout(() => {
          router.push("/admin/questions");
        }, 1500);
      } else {
        setErrors({ submit: result.message || 'Failed to upload question' });
        toast.error(result.message || 'Failed to upload question');
      }
    } catch (error) {
      setErrors({ submit: 'Network error occurred' });
      toast.error('Network error occurred');
      console.error('Error uploading question:', error);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        // Save form data to localStorage
        const dataToSave = { ...formData };
        dataToSave.questionImage = null;
        dataToSave.solutionImage = null;
        dataToSave.options = dataToSave.options.map(opt => ({ ...opt, image: null }));
        dataToSave.hints = dataToSave.hints.map(hint => ({ ...hint, image: null }));
        
        localStorage.setItem('questionDraft', JSON.stringify(dataToSave));
        setIsSaved(true);
        
        // Hide the saved message after 3 seconds
        setTimeout(() => {
          setIsSaved(false);
        }, 3000);
      }
      
      // Navigate with arrow keys + ctrl
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (step < 4) {
          const validationErrors = validateForm(step);
          if (Object.keys(validationErrors).length === 0) {
            setStep(prev => Math.min(4, prev + 1));
          } else {
            setErrors(validationErrors);
          }
        }
      }
      
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep(prev => Math.max(1, prev - 1));
      }

      // Number keys for direct navigation (1-4) when holding Alt
      if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const targetStep = parseInt(e.key, 10);
        
        // Only validate if moving forward
        if (targetStep > step) {
          // Validate all steps up to the target
          for (let i = step; i < targetStep; i++) {
            const validationErrors = validateForm(i);
            if (Object.keys(validationErrors).length > 0) {
              setErrors(validationErrors);
              return;
            }
          }
        }
        
        setStep(targetStep);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, step]);

  // Function to handle tag input with comma or Enter key
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>, field: 'tags' | 'relatedTopics' | 'prerequisites') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = e.currentTarget;
      const value = input.value.trim();
      
      if (value && !formData[field].includes(value)) {
        setFormData({
          ...formData,
          [field]: [...formData[field], value]
        });
        input.value = '';
      }
    }
  };
  
  // Function to remove a tag from an array field
  const removeTag = (index: number, field: 'tags' | 'relatedTopics' | 'prerequisites') => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    });
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

      {/* Improved Tab Navigation */}
      <div className="mb-8">
        <div className="flex border-b border-gray-200">
          {FORM_STEPS.map((formStep, index) => (
            <button
              key={index}
              onClick={() => setStep(index + 1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setStep(index + 1);
                }
              }}
              tabIndex={0}
              aria-current={step === index + 1 ? 'step' : undefined}
              aria-pressed={step === index + 1}
              className={`flex items-center py-3 px-6 text-sm font-medium border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                step === index + 1 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } transition-colors ${index + 1 < step ? 'text-green-600' : ''}`}
            >
              <div className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-2 ${
                  index + 1 < step
                    ? 'bg-green-100 text-green-600 border border-green-500'
                    : step === index + 1
                      ? 'bg-blue-100 text-blue-600 border border-blue-500'
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                }`}>
                  {index + 1 < step ? (
                    <CheckCircle size={14} />
                  ) : (
                    formStep.icon || <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                {formStep.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      <form className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" onSubmit={(e) => e.preventDefault()}>
        {/* Step 1: Question Content */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Question Content</h2>
                <p className="text-xs text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mr-2">
                  Question Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.questionType}
                  onChange={(e) => handleInputChange(e, 'questionType')}
                  className="px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {QUESTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mr-2">
                  Question Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.questionCategory}
                  onChange={(e) => handleInputChange(e, 'questionCategory')}
                  className="px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {QUESTION_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mr-2">
                  Question Source <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.questionSource}
                  onChange={(e) => handleInputChange(e, 'questionSource')}
                  className="px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {QUESTION_SOURCES.map(source => (
                    <option key={source.value} value={source.value}>{source.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-3">
                <div className="flex-grow">
                  <textarea
                    id="question"
                    name="question"
                    value={formData.question}
                    onChange={(e) => handleInputChange(e)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] transition-shadow"
                    placeholder="Enter your question here..."
                  />
                </div>
                <div className="w-32">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => document.getElementById('questionImageInput')?.click()}>
                    {formData.questionImage ? (
                      <div className="relative w-full h-24">
                        <Image 
                          src={URL.createObjectURL(formData.questionImage)} 
                          alt="Question" 
                          fill
                          className="object-contain"
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileUpload(null, 'questionImage');
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Add Image</span>
                      </>
                    )}
                  </div>
                  <input
                    id="questionImageInput"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], 'questionImage');
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Either Question Text or Question Image is required</p>
              {errors.question && (
                <p className="mt-1 text-sm text-red-500">{errors.question}</p>
              )}
            </div>

            {formData.questionType !== 'numerical' ? (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Options <span className="text-red-500">*</span></label>
                {formData.options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <PlusCircle size={14} className="mr-1" />
                    Add Option
                  </button>
                )}
              </div>
              
              {errors.options && (
                <p className="text-sm text-red-500">{errors.options}</p>
              )}
              
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 cursor-pointer transition-colors ${
                            formData.correctOptions.includes(index)
                        ? 'bg-emerald-500 text-white'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                          onClick={() => handleCorrectOptionChange(index)}
                >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {formData.correctOptions.includes(index) ? 'Correct' : 'Incorrect'}
                        </span>
                    </div>
                    
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <MinusCircle size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleInputChange(e, 'options', 'text', index)}
                      className="flex-grow px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    
                    <div className="w-24">
                      <div
                        className="bg-gray-100 rounded-lg border border-gray-200 p-2 h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => document.getElementById(`optionImageInput-${index}`)?.click()}
                      >
                        {option.image ? (
                          <div className="relative w-full h-14">
                            <Image 
                              src={URL.createObjectURL(option.image)} 
                              alt={`Option ${String.fromCharCode(65 + index)}`} 
                              fill
                              className="object-contain" 
                            />
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileUpload(null, 'optionImage', index);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Image</span>
                          </>
                        )}
                      </div>
                      <input
                        id={`optionImageInput-${index}`}
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0], 'optionImage', index);
                          }
                        }}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Correct Option(s) <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500">Click on the circle next to an option to mark it as correct</p>
            </div>
            
            {errors.correctOptions && (
              <p className="text-sm text-red-500">{errors.correctOptions}</p>
            )}
          </div>
          ) : (
            <div className="space-y-4 border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors">
              <h3 className="text-md font-medium text-gray-800">Numerical Answer <span className="text-red-500">*</span></h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exact Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.numericalAnswer?.exactValue || 0}
                    onChange={(e) => handleInputChange(
                      e, 
                      'numericalAnswer', 
                      'exactValue',
                    )}
                    step="any"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                  {errors['numericalAnswer.exactValue'] && (
                    <p className="mt-1 text-sm text-red-500">{errors['numericalAnswer.exactValue']}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.numericalAnswer?.unit || ''}
                    onChange={(e) => handleInputChange(
                      e, 
                      'numericalAnswer', 
                      'unit',
                    )}
                    placeholder="e.g., m/s, kg, °C"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Range Minimum <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.numericalAnswer?.range.min || 0}
                    onChange={(e) => handleInputChange(
                      {
                        target: {
                          name: 'numericalAnswer.range', 
                          value: parseFloat(e.target.value)
                        }
                      } as any, 
                      'numericalAnswer.range', 
                      'min'
                    )}
                    step="any"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Range Maximum <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.numericalAnswer?.range.max || 0}
                    onChange={(e) => handleInputChange(
                      {
                        target: {
                          name: 'numericalAnswer.range', 
                          value: parseFloat(e.target.value)
                        }
                      } as any, 
                      'numericalAnswer.range', 
                      'max'
                    )}
                    step="any"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                  />
                </div>
              </div>
              
              {errors['numericalAnswer.range'] && (
                <p className="text-sm text-red-500">{errors['numericalAnswer.range']}</p>
              )}
              
              <div className="mt-2 text-sm text-gray-600 bg-blue-100 p-3 rounded-md shadow-sm">
                <AlertCircle className="inline mr-1" size={14} />
                The exact value must fall within the range. The range defines the acceptable answers.
              </div>
            </div>
          )}
        </div>
        )}

        {/* Step 2: Details & Classification */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Details & Classification</h2>
                <p className="text-xs text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Select Exam Type</option>
                  {EXAM_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.examType && (
                  <p className="mt-1 text-sm text-red-500">{errors.examType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Select Class</option>
                  {CLASS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors.class && (
                  <p className="mt-1 text-sm text-red-500">{errors.class}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Select Subject</option>
                  {SUBJECTS.map(subject => (
                    <option key={subject.value} value={subject.value}>{subject.label}</option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chapter <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="chapter"
                  value={formData.chapter}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter chapter name"
                  required
                />
                {errors.chapter && (
                  <p className="mt-1 text-sm text-red-500">{errors.chapter}</p>
                )}
              </div>

              {/* Section field based on subject */}
              {['physics', 'chemistry', 'mathematics', 'general_test', 'english', 'biology'].includes(formData.subject.toLowerCase()) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.subject} Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Select Section</option>
                    {getSubjectSections().map(section => (
                      <option key={section.value} value={section.value}>{section.label}</option>
                    ))}
                  </select>
                  {errors.section && (
                    <p className="mt-1 text-sm text-red-500">{errors.section}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty <span className="text-red-500">*</span></label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
                {errors.difficulty && (
                  <p className="mt-1 text-sm text-red-500">{errors.difficulty}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conceptual Difficulty (1-10)</label>
                <div className="flex items-center">
                  <input
                    type="range"
                    name="conceptualDifficulty"
                    min="1"
                    max="10"
                    value={formData.conceptualDifficulty}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="ml-2 text-gray-700 font-medium">{formData.conceptualDifficulty}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Language & Year</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language <span className="text-red-500">*</span></label>
                <select
                    name="language"
                    value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                    {LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language Level <span className="text-red-500">*</span></label>
                <select
                  name="languageLevel"
                    value={formData.languageLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {LANGUAGE_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                    name="year"
                    value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="not applicable">Not Applicable</option>
                    {YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Marks & Time</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
                  <input
                    type="number"
                    name="negativeMarks"
                    value={formData.negativeMarks}
                    onChange={handleInputChange}
                    max="0"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Time (seconds)</label>
                  <input
                    type="number"
                    name="expectedTime"
                    value={formData.expectedTime}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Solution & Hints */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Solution & Hints</h2>
                <p className="text-xs text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Solution</h3>
              <div className="flex space-x-3">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Solution Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="solution"
                    value={formData.solution}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px] transition-shadow"
                    placeholder="Provide a detailed solution..."
                  />
                  {errors.solution && (
                    <p className="mt-1 text-sm text-red-500">{errors.solution}</p>
                  )}
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <div 
                    className="bg-gray-50 rounded-lg border border-gray-200 p-3 h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => document.getElementById('solutionImageInput')?.click()}
                  >
                    {formData.solutionImage ? (
                      <div className="relative w-full h-24">
                        <Image 
                          src={URL.createObjectURL(formData.solutionImage)} 
                          alt="Solution" 
                          fill
                          className="object-contain"
                        />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileUpload(null, 'solutionImage');
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Add Image</span>
                      </>
                    )}
                  </div>
                  <input
                    id="solutionImageInput"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], 'solutionImage');
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">Either Solution Text or Solution Image is required</div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Hints</h3>
                {formData.hints.length < 4 && (
                  <button
                    type="button"
                    onClick={addHint}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <PlusCircle size={16} className="mr-1" />
                    Add Hint
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {formData.hints.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Lightbulb className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No hints added yet. Add up to 4 hints to help students.
                    </p>
                  </div>
                ) : (
                  formData.hints.map((hint, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-medium text-gray-700">
                          Hint {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeHint(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <MinusCircle size={16} />
                        </button>
                      </div>
                      
                      <div className="flex space-x-3">
                        <div className="flex-grow">
                          <textarea
                            value={hint.text}
                            onChange={(e) => handleInputChange(e, 'hints', 'text', index)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                            placeholder="Enter hint text"
                            rows={3}
                          />
                        </div>
                        <div className="w-24">
                          <div 
                            className="bg-gray-100 rounded-lg border border-gray-200 p-2 h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() => document.getElementById(`hintImageInput-${index}`)?.click()}
                          >
                            {hint.image ? (
                              <div className="relative w-full h-16">
                                <Image 
                                  src={URL.createObjectURL(hint.image)} 
                                  alt={`Hint ${index + 1}`} 
                                  fill
                                  className="object-contain" 
                                />
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileUpload(null, 'hintImage', index);
                                  }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Image</span>
                              </>
                            )}
                          </div>
                          <input
                            id={`hintImageInput-${index}`}
                            type="file"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(e.target.files[0], 'hintImage', index);
                              }
                            }}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Common Mistakes</h3>
                <button
                  type="button"
                  onClick={addCommonMistake}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <PlusCircle size={16} className="mr-1" />
                  Add Common Mistake
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.commonMistakes.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No common mistakes added yet. Adding these helps students avoid typical errors.
                    </p>
                  </div>
                ) : (
                  formData.commonMistakes.map((mistake, index) => (
                    <div key={index} className="bg-red-50 rounded-lg p-4 border border-red-100 hover:bg-red-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-md font-medium text-gray-700">
                          Common Mistake {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeCommonMistake(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <MinusCircle size={16} />
                        </button>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={mistake.description}
                          onChange={(e) => handleInputChange(e, 'commonMistakes', 'description', index)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="Describe the mistake (e.g., 'Forgetting to convert units')"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Explanation
                        </label>
                        <textarea
                          value={mistake.explanation}
                          onChange={(e) => handleInputChange(e, 'commonMistakes', 'explanation', index)}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                          placeholder="Explain why this is a mistake and how to avoid it"
                          rows={3}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Tags & Topics */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Tags & Topics</h2>
                <p className="text-xs text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Tags</h3>
              <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white min-h-[100px]">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm flex items-center">
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(index, 'tags')}
                      className="ml-1 text-purple-800 hover:text-purple-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  className="flex-grow outline-none px-2 py-1 min-w-[150px]"
                  placeholder="Type and press comma or Enter to add tags"
                  onKeyDown={(e) => handleTagInput(e, 'tags')}
                />
              </div>
              <p className="text-sm text-gray-500">Type a tag and press comma or Enter to add it</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Related Topics</h3>
              <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white min-h-[100px]">
                {formData.relatedTopics.map((topic, index) => (
                  <div key={index} className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center">
                    {topic}
                    <button 
                      type="button" 
                      onClick={() => removeTag(index, 'relatedTopics')}
                      className="ml-1 text-blue-800 hover:text-blue-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  className="flex-grow outline-none px-2 py-1 min-w-[150px]"
                  placeholder="Type and press comma or Enter to add topics"
                  onKeyDown={(e) => handleTagInput(e, 'relatedTopics')}
                />
              </div>
              <p className="text-sm text-gray-500">Type a topic and press comma or Enter to add it</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Prerequisites</h3>
              <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-white min-h-[100px]">
                {formData.prerequisites.map((prereq, index) => (
                  <div key={index} className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm flex items-center">
                    {prereq}
                    <button 
                      type="button" 
                      onClick={() => removeTag(index, 'prerequisites')}
                      className="ml-1 text-green-800 hover:text-green-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  className="flex-grow outline-none px-2 py-1 min-w-[150px]"
                  placeholder="Type and press comma or Enter to add prerequisites"
                  onKeyDown={(e) => handleTagInput(e, 'prerequisites')}
                />
              </div>
              <p className="text-sm text-gray-500">Type a prerequisite and press comma or Enter to add it</p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setStep(prev => Math.max(1, prev - 1));
            }}
            disabled={step === 1}
            className={`px-6 py-2 rounded-lg text-sm font-medium ${
              step === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </div>
          </button>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('questionDraft');
                router.push('/admin/questions');
              }}
              className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  // Basic validation before proceeding
                  const validationErrors = validateForm(step);
                  if (Object.keys(validationErrors).length > 0) {
                    setErrors(validationErrors);
                    return;
                  }
                  setStep(prev => prev + 1);
                }}
                className="px-6 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700"
              >
                <div className="flex items-center">
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700"
              >
                <div className="flex items-center">
                  <Save size={16} className="mr-1" />
                  Submit Question
                </div>
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
    </div>
  );
}

