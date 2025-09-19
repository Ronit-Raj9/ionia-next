"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  FunnelIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  AcademicCapIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useQuestionStore } from '../../store/questionStore';

// Filter options
const filterOptions = {
  subjects: ['physics', 'chemistry', 'mathematics', 'biology', 'english', 'general knowledge', 'computer science', 'information practice'],
  examTypes: ['jee_main', 'jee_adv', 'cuet', 'neet', 'cbse_11', 'cbse_12', 'none'],
  difficulties: ['easy', 'medium', 'hard'],
  languages: ['english', 'hindi'],
  languageLevels: ['basic', 'intermediate', 'advanced'],
  questionTypes: ['single', 'multiple', 'numerical'],
  classes: ['class_9', 'class_10', 'class_11', 'class_12', 'none'],
  questionCategories: ['theoretical', 'numerical'],
  questionSources: ['custom', 'india_book', 'foreign_book', 'pyq'],
  sections: {
    physics: ['mechanics', 'electromagnetism', 'thermodynamics', 'optics', 'modern_physics', 'none'],
    chemistry: ['organic', 'inorganic', 'physical', 'analytical', 'none'],
    mathematics: ['algebra', 'calculus', 'geometry', 'statistics', 'trigonometry', 'none'],
    biology: ['botany', 'zoology', 'human_physiology', 'ecology', 'genetics', 'none'],
    english: ['reading_comprehension', 'vocabulary', 'grammar', 'writing', 'none'],
    general_knowledge: ['gk', 'current_affairs', 'general_science', 'mathematical_reasoning', 'logical_reasoning', 'none'],
    computer_science: ['programming', 'data_structures', 'algorithms', 'databases', 'none'],
    information_practice: ['programming', 'databases', 'web_development', 'none']
  }
};

const dateRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' }
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'difficulty', label: 'Difficulty Level' }
];

interface QuestionFiltersProps {
  className?: string;
}

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({ className = '' }) => {
  const {
    filters,
    showFilters,
    activeFilterTab,
    setFilters,
    resetFilters,
    setActiveFilterTab
  } = useQuestionStore();

  // Helper function to get available sections based on selected subjects
  const getAvailableSections = () => {
    if (filters.subject.length === 0) return [];
    
    return filters.subject.flatMap(subj => {
      const subjectKey = subj.toLowerCase().replace(/\s+/g, '_');
      const sections = filterOptions.sections[subjectKey as keyof typeof filterOptions.sections] || [];
      
      return sections.map(section => ({
        value: section,
        label: section.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }));
    });
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.subject.length > 0) count++;
    if (filters.examType.length > 0) count++;
    if (filters.difficulty.length > 0) count++;
    if (filters.year.length > 0) count++;
    if (filters.section.length > 0) count++;
    if (filters.languageLevel.length > 0) count++;
    if (filters.questionCategory.length > 0) count++;
    if (filters.questionSource.length > 0) count++;
    if (filters.solutionMode) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.hasOptions !== null) count++;
    if (filters.isVerified !== null) count++;
    if (filters.sortBy !== 'createdAt') count++;
    if (filters.class.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  // Custom multi-select dropdown component
  const CheckboxMultiSelect = ({ 
    values, 
    onChange,
    options, 
    placeholder,
    className = "",
    isLoading = false
  }: { 
    values: string[], 
    onChange: (values: string[]) => void, 
    options: string[] | { value: string, label: string }[],
    placeholder: string,
    className?: string,
    isLoading?: boolean
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
            panelRef.current && !panelRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);
    
    const formatOptions = (): { value: string, label: string }[] => {
      return options.map(option => 
        typeof option === 'string' 
          ? { value: option, label: option }
          : option
      );
    };
    
    const formattedOptions = formatOptions();
    
    const toggleOption = (value: string) => {
      let newValues;
      if (values.includes(value)) {
        newValues = values.filter(v => v !== value);
      } else {
        newValues = [...values, value];
      }
      onChange(newValues);
    };
    
    const toggleAll = () => {
      let newValues: string[];
      if (values.length === formattedOptions.length) {
        newValues = [];
      } else {
        newValues = formattedOptions.map(opt => opt.value);
      }
      onChange(newValues);
    };
    
    const displayText = values.length > 0 
      ? `${values.length} selected` 
      : placeholder;
      
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`w-full rounded-lg border-green-200 focus:ring-green-500 focus:border-green-500 bg-white 
            transition-all duration-200 cursor-pointer hover:border-green-400 text-left
            pl-4 pr-10 py-2.5 text-sm text-gray-700 border shadow-sm
            ${isLoading ? 'opacity-75 cursor-wait' : ''}
            ${className}`}
        >
          <div className="flex items-center justify-between">
            <span className={values.length === 0 ? "text-gray-500" : "text-gray-800"}>
              {isLoading ? "Loading..." : displayText}
            </span>
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} />
            )}
          </div>
        </button>
        
        {isOpen && !isLoading && (
          <div 
            ref={panelRef}
            className="absolute z-10 mt-1 w-full bg-white border border-green-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto custom-scrollbar"
            onMouseDown={(e) => e.stopPropagation()} 
          >
            <div className="sticky top-0 bg-green-50 border-b border-green-200 px-3 py-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={values.length === formattedOptions.length && formattedOptions.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm font-medium text-green-800">Select All</span>
              </div>
            </div>
            {formattedOptions.map((option) => (
              <label 
                key={option.value} 
                className="flex items-center px-3 py-2 hover:bg-green-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={values.includes(option.value)}
                  onChange={() => toggleOption(option.value)} 
                  className="h-4 w-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700 whitespace-pre-wrap">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Custom single select dropdown
  const CustomSelect = ({ 
    value, 
    onChange, 
    options, 
    placeholder,
    className = ""
  }: { 
    value: string, 
    onChange: (value: string) => void, 
    options: string[] | { value: string, label: string }[],
    placeholder: string,
    className?: string
  }) => {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border-green-200 focus:ring-green-500 focus:border-green-500 bg-white 
          transition-all duration-200 cursor-pointer appearance-none hover:border-green-400
          pl-4 pr-10 py-2.5 text-sm text-gray-700 bg-no-repeat bg-[right_0.75rem_center]
          bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLTEuNDF6IiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=')] 
          ${className}`}
      >
        <option value="">{placeholder}</option>
        {Array.isArray(options) && options.map((option) => (
          typeof option === 'string' ? (
            <option key={option} value={option} className="py-2">{option}</option>
          ) : (
            <option key={option.value} value={option.value} className="py-2">{option.label}</option>
          )
        ))}
      </select>
    );
  };

  const handleSectionChange = (values: string[]) => {
    setFilters({ section: values });
  };

  return (
    <div className={`w-full transition-all duration-300 ease-in-out ${className}`}>
      <div className="lg:sticky lg:top-4 bg-white rounded-xl shadow-sm border border-green-100 flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-100 bg-white">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-lg font-medium text-green-800">Filters</h2>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-sm text-green-600 hover:text-green-700 transition-colors duration-200 flex items-center"
            >
              <span className="mr-1">Reset</span>
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                {activeFiltersCount}
              </span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-green-100">
          {[
            { id: 'basic', label: 'Basic', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" /> },
            { id: 'advanced', label: 'Advanced', icon: <AcademicCapIcon className="h-4 w-4" /> },
            { id: 'additional', label: 'Additional', icon: <AdjustmentsHorizontalIcon className="h-4 w-4" /> },
            { id: 'sorting', label: 'Sorting', icon: <ClockIcon className="h-4 w-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterTab(tab.id)}
              className={`flex-1 py-3 text-xs font-medium flex flex-col items-center justify-center transition-colors duration-200
                ${activeFilterTab === tab.id 
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              {tab.icon}
              <span className="mt-1">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            {/* Basic Filters Tab */}
            {activeFilterTab === 'basic' && (
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-medium text-green-800">Basic Filters</h3>
                </div>
                
                {/* Subject Filter */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Subject</label>
                  <CheckboxMultiSelect
                    values={filters.subject}
                    onChange={(values) => setFilters({ subject: values })}
                    options={filterOptions.subjects.map(subject => ({
                      value: subject,
                      label: subject.charAt(0).toUpperCase() + subject.slice(1)
                    }))}
                    placeholder="All Subjects"
                  />
                </div>

                {/* Year Filter */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Year</label>
                  <CheckboxMultiSelect
                    values={filters.year}
                    onChange={(values) => setFilters({ year: values })}
                    options={['2024', '2023', '2022', '2021', '2020', '2019']}
                    placeholder="All Years"
                  />
                </div>

                {/* Section Filter */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Section</label>
                  <CheckboxMultiSelect
                    values={filters.section}
                    onChange={handleSectionChange}
                    options={getAvailableSections()}
                    placeholder="All Sections"
                    isLoading={false}
                  />
                </div>

                {/* Difficulty Filter with Pills */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {filterOptions.difficulties.map((diff) => (
                      <button
                        key={diff}
                        onClick={() => {
                          if (filters.difficulty.includes(diff)) {
                            setFilters({ difficulty: filters.difficulty.filter(d => d !== diff) });
                          } else {
                            setFilters({ difficulty: [...filters.difficulty, diff] });
                          }
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                          ${filters.difficulty.includes(diff)
                            ? 'bg-green-100 text-green-800 border border-green-200 shadow-sm'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-green-200'
                          }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Filters Tab */}
            {activeFilterTab === 'advanced' && (
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <AcademicCapIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-medium text-green-800">Advanced Filters</h3>
                </div>
                
                {/* Exam Type Filter */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Exam Type</label>
                  <CheckboxMultiSelect
                    values={filters.examType}
                    onChange={(values) => setFilters({ examType: values })}
                    options={filterOptions.examTypes}
                    placeholder="All Exam Types"
                  />
                </div>

                {/* Class Filter */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Class</label>
                  <CheckboxMultiSelect
                    values={filters.class}
                    onChange={(values) => setFilters({ class: values })}
                    options={[
                      { value: 'class_9', label: 'Class 9' },
                      { value: 'class_10', label: 'Class 10' },
                      { value: 'class_11', label: 'Class 11' },
                      { value: 'class_12', label: 'Class 12' },
                      { value: 'none', label: 'Not Applicable' }
                    ]}
                    placeholder="Select Class"
                  />
                </div>

                {/* Question Type */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Question Type</label>
                  <CheckboxMultiSelect
                    values={filters.questionType}
                    onChange={(values) => setFilters({ questionType: values })}
                    options={filterOptions.questionTypes}
                    placeholder="All Question Types"
                  />
                </div>

                {/* Question Category */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Question Category</label>
                  <CheckboxMultiSelect
                    values={filters.questionCategory}
                    onChange={(values) => setFilters({ questionCategory: values })}
                    options={filterOptions.questionCategories}
                    placeholder="All Categories"
                  />
                </div>
              </div>
            )}

            {/* Additional Filters Tab */}
            {activeFilterTab === 'additional' && (
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <AdjustmentsHorizontalIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-medium text-green-800">Additional Options</h3>
                </div>
                
                {/* Question Source */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Question Source</label>
                  <CheckboxMultiSelect
                    values={filters.questionSource}
                    onChange={(values) => setFilters({ questionSource: values })}
                    options={filterOptions.questionSources}
                    placeholder="All Sources"
                  />
                </div>

                {/* Language Level */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Language Level</label>
                  <CheckboxMultiSelect
                    values={filters.languageLevel}
                    onChange={(values) => setFilters({ languageLevel: values })}
                    options={filterOptions.languageLevels}
                    placeholder="All Levels"
                  />
                </div>

                {/* Solution Mode */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Solution Mode</label>
                  <CustomSelect
                    value={filters.solutionMode}
                    onChange={(value) => setFilters({ solutionMode: value })}
                    options={['Text', 'Conceptual', 'Option']}
                    placeholder="All Modes"
                  />
                </div>

                {/* Date Range Filter */}
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Date Added</label>
                  <CustomSelect
                    value={filters.dateRange}
                    onChange={(value) => setFilters({ dateRange: value })}
                    options={dateRangeOptions}
                    placeholder="Select Date Range"
                  />
                </div>

                {/* Additional Toggle Filters */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center p-2 rounded-lg hover:bg-green-50 transition-colors duration-200 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.hasOptions === true}
                      onChange={(e) => setFilters({ hasOptions: e.target.checked ? true : null })}
                      className="rounded border-green-300 text-green-600 focus:ring-green-500 transition-colors duration-200
                        group-hover:border-green-400"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-green-700 transition-colors duration-200">
                      Has Options
                    </span>
                  </label>
                  <label className="flex items-center p-2 rounded-lg hover:bg-green-50 transition-colors duration-200 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.isVerified === true}
                      onChange={(e) => setFilters({ isVerified: e.target.checked ? true : null })}
                      className="rounded border-green-300 text-green-600 focus:ring-green-500 transition-colors duration-200
                        group-hover:border-green-400"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-green-700 transition-colors duration-200">
                      Verified Questions
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Sorting Tab */}
            {activeFilterTab === 'sorting' && (
              <div className="space-y-4">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-sm font-medium text-green-800">Sort Questions</h3>
                </div>
                
                <div className="filter-group">
                  <label className="block text-sm font-medium text-green-700 mb-2">Sort By</label>
                  <CustomSelect
                    value={filters.sortBy}
                    onChange={(value) => setFilters({ sortBy: value })}
                    options={sortOptions}
                    placeholder="Select Sorting"
                    className="bg-white"
                  />
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-green-700 mb-2">Sort Direction</label>
                    <div className="flex">
                      <button
                        onClick={() => setFilters({ sortOrder: 'asc' })}
                        className={`flex-1 px-3 py-2 border border-r-0 rounded-l-lg text-sm font-medium 
                          ${filters.sortOrder === 'asc' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        Ascending
                      </button>
                      <button
                        onClick={() => setFilters({ sortOrder: 'desc' })}
                        className={`flex-1 px-3 py-2 border rounded-r-lg text-sm font-medium 
                          ${filters.sortOrder === 'desc' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        Descending
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #22c55e #e2e8f0;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #22c55e;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #16a34a;
        }
        .custom-scrollbar {
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};