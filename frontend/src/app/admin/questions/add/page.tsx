"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Save,
  Eye,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2
} from "lucide-react";

// Predefined options
const EXAM_TYPES = ["JEE Main", "JEE Advanced", "NEET", "BITSAT"];
const SUBJECTS = ["Physics", "Chemistry", "Mathematics"];
const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];
const LANGUAGE_LEVELS = ["Basic", "Intermediate", "Advanced"];
const SOLUTION_MODES = ["Numerical", "MCQ", "Theory"];
const YEARS = Array.from({ length: 11 }, (_, i) => (new Date().getFullYear() - i).toString());

// Physics sections
const PHYSICS_SECTIONS = [
  "Mechanics",
  "Thermodynamics",
  "Electromagnetism",
  "Optics",
  "Modern Physics",
  "Waves",
];

// Chemistry sections
const CHEMISTRY_SECTIONS = [
  "Physical Chemistry",
  "Organic Chemistry",
  "Inorganic Chemistry",
  "Analytical Chemistry",
];

// Mathematics sections
const MATHEMATICS_SECTIONS = [
  "Algebra",
  "Calculus",
  "Trigonometry",
  "Coordinate Geometry",
  "Vectors",
  "Statistics",
];

export default function AddQuestion() {
  const [step, setStep] = useState(1);
  const [questionData, setQuestionData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctOption: 0,
    examType: "",
    subject: "",
    sectionPhysics: "",
    sectionChemistry: "",
    sectionMathematics: "",
    difficulty: "",
    year: new Date().getFullYear().toString(),
    languageLevel: "",
    solutionMode: "",
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Autosave functionality
  useEffect(() => {
    const autosaveData = () => {
      localStorage.setItem('questionDraft', JSON.stringify(questionData));
    };

    const timeoutId = setTimeout(autosaveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [questionData]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('questionDraft');
    if (draft) {
      setQuestionData(JSON.parse(draft));
    }
  }, []);

  // Handle input changes with validation
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, 
    index?: number
  ) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    if (index !== undefined) {
      const newOptions = [...questionData.options];
      newOptions[index] = value;
      setQuestionData({ ...questionData, options: newOptions });
    } else {
      setQuestionData({ ...questionData, [name]: value });
    }
    setSaved(false);
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!questionData.question.trim()) {
      newErrors.question = 'Question is required';
    }
    
    questionData.options.forEach((option, index) => {
      if (!option.trim()) {
        newErrors[`option-${index}`] = 'Option is required';
      }
    });

    if (!questionData.examType) {
      newErrors.examType = 'Exam type is required';
    }

    if (!questionData.subject) {
      newErrors.subject = 'Subject is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const uploadUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/upload`;

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(questionData),
      });

      const result = await response.json();

      if (response.ok) {
        setSaved(true);
        localStorage.removeItem('questionDraft');
        setTimeout(() => {
          router.push("/admin/questions");
        }, 1500);
      } else {
        setErrors({ submit: result.error || 'Failed to upload question' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // Get sections based on selected subject
  const getSubjectSections = () => {
    switch (questionData.subject) {
      case 'Physics':
        return PHYSICS_SECTIONS;
      case 'Chemistry':
        return CHEMISTRY_SECTIONS;
      case 'Mathematics':
        return MATHEMATICS_SECTIONS;
      default:
        return [];
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSubmit(new Event('submit') as any);
      }
      if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        setStep(prev => Math.min(prev + 1, 3));
      }
      if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep(prev => Math.max(prev - 1, 1));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [questionData]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Question</h1>
        <p className="mt-2 text-gray-600">Fill in the question details below. Use Ctrl + Arrow keys to navigate steps.</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Question Details', 'Subject Information', 'Additional Details'].map((title, index) => (
            <div
              key={title}
              className={`flex items-center ${index < 2 ? 'flex-1' : ''}`}
              onClick={() => setStep(index + 1)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step > index + 1 ? 'bg-emerald-500' :
                  step === index + 1 ? 'bg-blue-500' : 'bg-gray-200'
                } text-white cursor-pointer`}
              >
                {step > index + 1 ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${step === index + 1 ? 'text-blue-500' : 'text-gray-500'}`}>
                  {title}
                </p>
              </div>
              {index < 2 && (
                <div className="flex-1 ml-3">
                  <div className={`h-0.5 ${step > index + 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Step 1: Question Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
              <textarea
                name="question"
                value={questionData.question}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
              {errors.question && (
                <p className="mt-1 text-sm text-red-500">{errors.question}</p>
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              {questionData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-none">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        questionData.correctOption === index
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => setQuestionData({ ...questionData, correctOption: index })}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleInputChange(e, index)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Subject Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <select
                  name="examType"
                  value={questionData.examType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Exam Type</option>
                  {EXAM_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  name="subject"
                  value={questionData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Subject</option>
                  {SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>

            {questionData.subject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  name={`section${questionData.subject}`}
                  value={questionData[`section${questionData.subject}` as keyof typeof questionData]}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Section</option>
                  {getSubjectSections().map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Additional Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  name="difficulty"
                  value={questionData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Difficulty</option>
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  name="year"
                  value={questionData.year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="not applicable">Not Applicable</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language Level</label>
                <select
                  name="languageLevel"
                  value={questionData.languageLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Language Level</option>
                  {LANGUAGE_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solution Mode</label>
                <select
                  name="solutionMode"
                  value={questionData.solutionMode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Solution Mode</option>
                  {SOLUTION_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Navigation and Submit Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(prev => Math.max(prev - 1, 1))}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              step === 1
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="flex items-center space-x-4">
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(prev => Math.min(prev + 1, 3))}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || saved}
                className={`inline-flex items-center px-6 py-2 text-sm font-medium text-white rounded-md ${
                  loading || saved
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Question
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="ml-3 text-sm text-red-500">{errors.submit}</p>
            </div>
          </div>
        )}
      </form>

      {/* Preview Panel */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Eye className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Preview</h3>
        </div>
        <div className="space-y-4">
          <p className="text-gray-900">{questionData.question || 'Your question will appear here...'}</p>
          {questionData.options.map((option, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                questionData.correctOption === index
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
              {option || `Option ${String.fromCharCode(65 + index)} will appear here...`}
            </div>
          ))}
          {(questionData.subject || questionData.examType || questionData.difficulty) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {questionData.subject && (
                <span className="px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded">
                  {questionData.subject}
                </span>
              )}
              {questionData.examType && (
                <span className="px-2 py-1 text-sm bg-purple-50 text-purple-700 rounded">
                  {questionData.examType}
                </span>
              )}
              {questionData.difficulty && (
                <span className="px-2 py-1 text-sm bg-orange-50 text-orange-700 rounded">
                  {questionData.difficulty}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
