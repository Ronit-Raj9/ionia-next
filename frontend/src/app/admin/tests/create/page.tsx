"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Plus, 
  X, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  BookOpen,
  GraduationCap,
  CalendarDays,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctOption: number;
  examType: string;
  subject: string;
  sectionPhysics: string;
  sectionChemistry: string;
  sectionMathematics: string;
  difficulty: string;
  year: string;
}

// Add MultiSelect interface
interface MultiSelectOption {
  value: string;
  label: string;
}

interface FilterState {
  examType: string[];
  year: string[];
  subject: string[];
  difficulty: string[];
  section: string[];
  searchTerm: string;
}

// Add MultiSelect component
function MultiSelect({ 
  options, 
  value, 
  onChange, 
  placeholder,
  label
}: { 
  options: MultiSelectOption[],
  value: string[],
  onChange: (value: string[]) => void,
  placeholder: string,
  label: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(option.value)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        className="min-h-[42px] px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 bg-white cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-wrap gap-2">
          {value.length > 0 ? (
            value.map((val) => (
              <span
                key={val}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-emerald-50 text-emerald-700"
              >
                {options.find(opt => opt.value === val)?.label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter(v => v !== val));
                  }}
                  className="ml-1 hover:text-emerald-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-2">
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                className="px-3 py-2 hover:bg-emerald-50 cursor-pointer flex items-center justify-between"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([...value, option.value]);
                }}
              >
                {option.label}
                <Check className={`w-4 h-4 text-emerald-600 ${value.includes(option.value) ? 'opacity-100' : 'opacity-0'}`} />
              </li>
            ))}
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-gray-500 text-center">
                No options found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function CreateTestPage() {
  const router = useRouter();
  
  // Test Details State
  const [testDetails, setTestDetails] = useState({
    title: "",
    examType: "",
    year: "",
    shift: "",
    subject: "",
    difficulty: "",
    duration: 180, // Default 3 hours in minutes
  });

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    examType: [],
    year: [],
    subject: [],
    difficulty: [],
    section: [],
    searchTerm: "",
  });

  // UI State
  const [showFilters, setShowFilters] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  // Available Options (for dropdowns)
  const [availableOptions, setAvailableOptions] = useState<{
    subjects: Set<string>;
    examTypes: Set<string>;
    years: Set<string>;
    sections: Set<string>;
  }>({
    subjects: new Set<string>(),
    examTypes: new Set<string>(),
    years: new Set<string>(),
    sections: new Set<string>(),
  });

  // Add expanded state to track which questions show options
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Load Questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/get`, {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Failed to fetch questions");

        const data = await res.json();
        const allQuestions = data.data || [];

        // Extract unique values for filters
        const options = {
          subjects: new Set(allQuestions.map((q: Question) => q.subject)) as Set<string>,
          examTypes: new Set(allQuestions.map((q: Question) => q.examType)) as Set<string>,
          years: new Set(allQuestions.map((q: Question) => q.year)) as Set<string>,
          sections: new Set([
            ...allQuestions.map((q: Question) => q.sectionPhysics),
            ...allQuestions.map((q: Question) => q.sectionChemistry),
            ...allQuestions.map((q: Question) => q.sectionMathematics),
          ].filter(Boolean)) as Set<string>,
        };

        setAvailableOptions(options);
        setQuestions(allQuestions);
        setFilteredQuestions(allQuestions);
      } catch (err) {
        setError("Failed to load questions. Please try again.");
        console.error("Error loading questions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  // Apply Filters
  useEffect(() => {
    let filtered = questions;

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(searchLower)
      );
    }

    if (filters.examType.length > 0) {
      filtered = filtered.filter(q => filters.examType.includes(q.examType));
    }

    if (filters.year.length > 0) {
      filtered = filtered.filter(q => filters.year.includes(q.year));
    }

    if (filters.subject.length > 0) {
      filtered = filtered.filter(q => filters.subject.includes(q.subject));
    }

    if (filters.difficulty.length > 0) {
      filtered = filtered.filter(q => filters.difficulty.includes(q.difficulty));
    }

    if (filters.section.length > 0) {
      filtered = filtered.filter(q => 
        filters.section.some(section => 
          q.sectionPhysics === section ||
          q.sectionChemistry === section ||
          q.sectionMathematics === section
        )
      );
    }

    setFilteredQuestions(filtered);
  }, [filters, questions]);

  const handleCreateTest = async () => {
    if (
      !testDetails.title ||
      !testDetails.examType ||
      !testDetails.year ||
      !testDetails.shift ||
      !testDetails.subject ||
      !testDetails.difficulty ||
      selectedQuestions.length === 0
    ) {
      setError("Please fill in all required fields and select at least one question.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...testDetails,
          questions: selectedQuestions,
        }),
      });

      if (!response.ok) throw new Error("Failed to create test");

        router.push("/admin/tests");
    } catch (err) {
      setError("Failed to create test. Please try again.");
      console.error("Error creating test:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Replace the filter dropdowns with MultiSelect components
  const filterSection = showFilters && (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <MultiSelect
        options={[...availableOptions.examTypes].map(type => ({ value: type, label: type }))}
        value={filters.examType}
        onChange={(value) => setFilters({...filters, examType: value})}
        placeholder="Select exam types"
        label="Exam Types"
      />

      <MultiSelect
        options={[...availableOptions.subjects].map(subject => ({ value: subject, label: subject }))}
        value={filters.subject}
        onChange={(value) => setFilters({...filters, subject: value})}
        placeholder="Select subjects"
        label="Subjects"
      />

      <MultiSelect
        options={[
          { value: "Easy", label: "Easy" },
          { value: "Medium", label: "Medium" },
          { value: "Hard", label: "Hard" }
        ]}
        value={filters.difficulty}
        onChange={(value) => setFilters({...filters, difficulty: value})}
        placeholder="Select difficulties"
        label="Difficulties"
      />

      <MultiSelect
        options={[...availableOptions.years].map(year => ({ value: year, label: year }))}
        value={filters.year}
        onChange={(value) => setFilters({...filters, year: value})}
        placeholder="Select years"
        label="Years"
      />

      <MultiSelect
        options={[...availableOptions.sections].map(section => ({ value: section, label: section }))}
        value={filters.section}
        onChange={(value) => setFilters({...filters, section: value})}
        placeholder="Select sections"
        label="Sections"
      />

      <button
        onClick={() => setFilters({
          examType: [],
          year: [],
          subject: [],
          difficulty: [],
          section: [],
          searchTerm: "",
        })}
        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 h-[42px] mt-6"
      >
        <X className="w-4 h-4" />
        Clear All Filters
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Test</h1>
            <p className="mt-2 text-gray-600">Fill in the test details and select questions to create a new test.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
              <button 
                onClick={() => setError("")}
                className="ml-auto text-red-700 hover:text-red-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveStep(1)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2
                    ${activeStep === 1 
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm
                    ${activeStep === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    1
                  </div>
                  Test Details
                  {testDetails.title && testDetails.examType && testDetails.year && 
                   testDetails.shift && testDetails.subject && testDetails.difficulty && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveStep(2)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2
                    ${activeStep === 2
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm
                    ${activeStep === 2 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    2
                  </div>
                  Select Questions
                  {selectedQuestions.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-xs">
                      {selectedQuestions.length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </div>

          {activeStep === 1 ? (
            /* Test Details Form */
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Title
                  </label>
            <input
              type="text"
                    value={testDetails.title}
                    onChange={(e) => setTestDetails({...testDetails, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter test title"
            />
          </div>

          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Type
                  </label>
            <select
                    value={testDetails.examType}
                    onChange={(e) => setTestDetails({...testDetails, examType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select Exam Type</option>
                    {[...availableOptions.examTypes].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
            </select>
          </div>

          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={testDetails.year}
                    onChange={(e) => setTestDetails({...testDetails, year: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Year</option>
                    {[...availableOptions.years].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
          </div>

          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shift
                  </label>
            <select
                    value={testDetails.shift}
                    onChange={(e) => setTestDetails({...testDetails, shift: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select Shift</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
            </select>
          </div>

          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={testDetails.subject}
                    onChange={(e) => setTestDetails({...testDetails, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Subject</option>
                    {[...availableOptions.subjects].map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
          </div>

          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
            <select
                    value={testDetails.difficulty}
                    onChange={(e) => setTestDetails({...testDetails, difficulty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={testDetails.duration}
                    onChange={(e) => setTestDetails({...testDetails, duration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    min="1"
                  />
          </div>
        </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  Select Questions
                </button>
                <button
                  onClick={handleCreateTest}
                  disabled={loading || selectedQuestions.length === 0}
                  className={`px-4 py-2 rounded-lg text-white ${
                    loading || selectedQuestions.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Creating Test...
                    </div>
                  ) : (
                    'Create Test'
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Question Selection */
            <div className="space-y-6">
              {/* Search and Filter Bar */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
                        value={filters.searchTerm}
                        onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                        placeholder="Search questions..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <Filter className="w-5 h-5 mr-2" />
                    Filters
                    <ChevronDown className={`w-5 h-5 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
        </div>

                {/* Filter Options */}
                {filterSection}
              </div>

              {/* Questions List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Questions ({filteredQuestions.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const allIds = new Set(filteredQuestions.map(q => q._id));
                            setExpandedQuestions(allIds);
                          }}
                          className="inline-flex items-center px-2 py-1 text-sm text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100"
                        >
                          <ChevronDown className="w-4 h-4 mr-1" />
                          Expand All
                        </button>
                        <button
                          onClick={() => setExpandedQuestions(new Set())}
                          className="inline-flex items-center px-2 py-1 text-sm text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
                        >
                          <ChevronRight className="w-4 h-4 mr-1" />
                          Collapse All
                        </button>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">
                      Selected: {selectedQuestions.length}
                    </span>
                  </div>
        </div>

                <div className="divide-y divide-gray-200">
              {filteredQuestions.map((question) => (
                    <div
                      key={question._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        selectedQuestions.includes(question._id) ? 'bg-emerald-50' : ''
                      } cursor-pointer`}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="flex-1"
                          onClick={() => {
                            const isSelected = selectedQuestions.includes(question._id);
                            setSelectedQuestions(
                              isSelected
                                ? selectedQuestions.filter(id => id !== question._id)
                                : [...selectedQuestions, question._id]
                            );
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault(); // Prevent text selection
                            setExpandedQuestions(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(question._id)) {
                                newSet.delete(question._id);
                              } else {
                                newSet.add(question._id);
                              }
                              return newSet;
                            });
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    selectedQuestions.includes(question._id)
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {selectedQuestions.includes(question._id) && (
                                    <Check className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                              <p className="text-gray-900 mb-2 flex-1 select-none">{question.question}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent selection when clicking expand
                                setExpandedQuestions(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(question._id)) {
                                    newSet.delete(question._id);
                                  } else {
                                    newSet.add(question._id);
                                  }
                                  return newSet;
                                });
                              }}
                              className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                              <ChevronRight className={`w-5 h-5 transform transition-transform ${
                                expandedQuestions.has(question._id) ? 'rotate-90' : ''
                              }`} />
                            </button>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 text-sm mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {question.subject}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {question.examType}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              question.difficulty === 'Easy'
                                ? 'bg-green-100 text-green-800'
                                : question.difficulty === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {question.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Options */}
                      {expandedQuestions.has(question._id) && (
                        <div 
                          className="mt-3 space-y-2 pl-4 border-l-2 border-gray-100"
                          onClick={(e) => e.stopPropagation()} // Prevent selection when clicking options
                        >
                      {question.options.map((option, index) => (
                        <div
                          key={index}
                              className={`p-2 rounded-md text-sm ${
                            index === question.correctOption
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-50 text-gray-700 border border-gray-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span className={`font-medium ${
                                  index === question.correctOption
                                    ? 'text-emerald-600'
                                    : 'text-gray-500'
                                }`}>
                                  {String.fromCharCode(65 + index)}.
                                </span>
                                <span>{option}</span>
                                {index === question.correctOption && (
                                  <Check className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                        </div>
                      ))}

                  {filteredQuestions.length === 0 && (
                    <div className="p-8 text-center">
                      <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your filters or search term
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6">
                <button
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                >
                  Test Details
                </button>
                <button
                  onClick={handleCreateTest}
                  disabled={loading || selectedQuestions.length === 0 || 
                    !testDetails.title || !testDetails.examType || !testDetails.year || 
                    !testDetails.shift || !testDetails.subject || !testDetails.difficulty}
                  className={`px-4 py-2 rounded-lg text-white ${
                    loading || selectedQuestions.length === 0 || 
                    !testDetails.title || !testDetails.examType || !testDetails.year || 
                    !testDetails.shift || !testDetails.subject || !testDetails.difficulty
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  title={
                    !testDetails.title || !testDetails.examType || !testDetails.year || 
                    !testDetails.shift || !testDetails.subject || !testDetails.difficulty
                      ? 'Please fill in all test details first'
                      : selectedQuestions.length === 0
                      ? 'Please select at least one question'
                      : ''
                  }
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Creating Test...
                    </div>
                  ) : (
                    'Create Test'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
