import { useState, useRef, useEffect } from "react";
import { Filter, Search, ChevronDown, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "../MultiSelect";
import { FilterState, AvailableOptions } from "./types";
import { examTypes, subjects } from "../types";

interface QuestionFilterProps {
  filters: FilterState;
  availableOptions: AvailableOptions;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  questions: any[]; // For determining available filter options dynamically
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// Collapsible filter section component
const FilterSection = ({ title, children, defaultOpen = true }: FilterSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
      <button 
        className="w-full px-4 py-3 bg-white flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-800">{title}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

// Status button component for more consistent styling
const StatusButton = ({ 
  active, 
  label, 
  onClick 
}: { 
  active: boolean; 
  label: string; 
  onClick: () => void; 
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
      ${active
        ? 'bg-green-100 text-green-800 border border-green-200'
        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
      }`}
  >
    {active && <Check className="inline-block mr-1 h-3 w-3" />}
    {label}
  </button>
);

export function QuestionFilter({
  filters,
  availableOptions,
  onFilterChange,
  onResetFilters,
  questions
}: QuestionFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFilterOpen]);

  // Track active filters to display badges on filter button
  const countActiveFilters = () => {
    return (
      (filters.searchTerm ? 1 : 0) + 
      filters.examType.length + 
      filters.year.length + 
      filters.subject.length + 
      filters.chapter.length + 
      filters.difficulty.length +
      filters.questionType.length +
      filters.questionCategory.length +
      filters.questionSource.length +
      filters.section.length +
      filters.languageLevel.length +
      filters.class.length +
      (filters.isVerified !== null ? 1 : 0) +
      (filters.isActive !== null ? 1 : 0) +
      (filters.marks.min !== null ? 1 : 0) +
      (filters.marks.max !== null ? 1 : 0) +
      (filters.negativeMarks.min !== null ? 1 : 0) +
      (filters.negativeMarks.max !== null ? 1 : 0)
    );
  };

  // Updates a single filter value
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  // Add or remove an item in a multi-select array
  const toggleArrayValue = (key: keyof FilterState, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateFilter(key, newValues);
  };

  const toggleDifficulty = (difficulty: string) => {
    const newDifficulties = filters.difficulty.includes(difficulty)
      ? filters.difficulty.filter(d => d !== difficulty)
      : [...filters.difficulty, difficulty];
    updateFilter('difficulty', newDifficulties);
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <Button 
        variant="outline" 
        className={`w-full flex items-center justify-between p-2 ${isFilterOpen ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
        onClick={toggleFilter}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-green-600" />
          <span className="font-medium">Filters</span>
          {countActiveFilters() > 0 && (
            <Badge className="bg-green-500 text-white">{countActiveFilters()}</Badge>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'transform rotate-180' : ''}`} />
      </Button>
      
      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-25 flex justify-center overflow-y-auto p-4">
          <div 
            ref={modalRef} 
            className="bg-white rounded-lg shadow-lg w-full max-w-3xl my-8"
            style={{ maxHeight: 'calc(100vh - 100px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-medium text-gray-800">Filter Questions</h3>
              <div className="flex items-center gap-2">
                {countActiveFilters() > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetFilters}
                    className="text-sm text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reset All
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleFilter}
                  className="text-gray-500"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Filter Content - Scrollable */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Questions</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                  <Input
                    type="text"
                    value={filters.searchTerm}
                    onChange={(e) => updateFilter('searchTerm', e.target.value)}
                    placeholder="Search question text..."
                    className="w-full pl-10"
                  />
                </div>
              </div>
              
              {/* Main Filters */}
              <div className="space-y-6">
                {/* Subject & Chapter Section */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Subject & Chapter</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Subject MultiSelect */}
                    <div>
                      <MultiSelect
                        options={subjects.map(subject => ({
                          label: subject.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          value: subject
                        }))}
                        value={filters.subject}
                        onChange={(selected) => updateFilter('subject', selected)}
                        placeholder="Select Subject(s)"
                        label="Subject"
                      />
                    </div>

                    {/* Chapter MultiSelect */}
                    <div>
                      <MultiSelect
                        options={Array.from(availableOptions.chapters)
                          .filter(chap => filters.subject.length === 0 || 
                            questions.some(q => filters.subject.includes(q.subject) && q.chapter === chap))
                          .map(chapter => ({
                            label: chapter,
                            value: chapter
                          }))
                        }
                        value={filters.chapter}
                        onChange={(selected) => updateFilter('chapter', selected)}
                        placeholder="Select Chapter(s)"
                        label="Chapter"
                        disabled={filters.subject.length === 0}
                      />
                    </div>
                  </div>
                </div>

                {/* Question Type & Class */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Question Properties</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {/* Question Type MultiSelect */}
                    <div>
                      <MultiSelect
                        options={Array.from(availableOptions.questionTypes).map(type => ({
                          label: type === 'single' ? 'Single Choice' : 
                                type === 'multiple' ? 'Multiple Choice' : 
                                type === 'numerical' ? 'Numerical' : type,
                          value: type
                        }))}
                        value={filters.questionType}
                        onChange={(selected) => updateFilter('questionType', selected)}
                        placeholder="Select Type(s)"
                        label="Question Type"
                      />
                    </div>

                    {/* Class MultiSelect */}
                    <div>
                      <MultiSelect
                        options={Array.from(availableOptions.classes).map(cls => ({
                          label: cls === 'none' ? 'N/A' : cls.replace('class_', 'Class '),
                          value: cls
                        }))}
                        value={filters.class}
                        onChange={(selected) => updateFilter('class', selected)}
                        placeholder="Select Class(es)"
                        label="Class"
                      />
                    </div>
                  </div>

                  {/* Difficulty Selection - Already supports multiple selection */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                      {['easy', 'medium', 'hard'].map((diff) => (
                        <StatusButton
                          key={diff}
                          active={filters.difficulty.includes(diff)}
                          label={diff.charAt(0).toUpperCase() + diff.slice(1)}
                          onClick={() => toggleDifficulty(diff)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Exam Details */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Exam Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Exam Type MultiSelect */}
                    <div>
                      <MultiSelect
                        options={examTypes.map(type => ({
                          label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          value: type
                        }))}
                        value={filters.examType}
                        onChange={(selected) => updateFilter('examType', selected)}
                        placeholder="Select Exam Type(s)"
                        label="Exam Type"
                      />
                    </div>

                    {/* Year MultiSelect */}
                    <div>
                      <MultiSelect
                        options={Array.from(availableOptions.years).sort().map(year => ({
                          label: year,
                          value: year
                        }))}
                        value={filters.year}
                        onChange={(selected) => updateFilter('year', selected)}
                        placeholder="Select Year(s)"
                        label="Year"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Filters Section */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Additional Filters</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Question Category */}
                    <div>
                      <MultiSelect
                        options={Array.from(availableOptions.questionCategories).map(cat => ({
                          label: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                          value: cat
                        }))}
                        value={filters.questionCategory}
                        onChange={(selected) => updateFilter('questionCategory', selected)}
                        placeholder="Select Category(s)"
                        label="Question Category"
                      />
                    </div>
                    
                    {/* Question Source */}
                    <div>
                      <MultiSelect
                        options={Array.from(availableOptions.questionSources).map(source => ({
                          label: source === 'custom' ? 'Custom' :
                                source === 'india_book' ? 'India Book' :
                                source === 'foreign_book' ? 'Foreign Book' :
                                source === 'pyq' ? 'PYQ' : source,
                          value: source
                        }))}
                        value={filters.questionSource}
                        onChange={(selected) => updateFilter('questionSource', selected)}
                        placeholder="Select Source(s)"
                        label="Question Source"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Status</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Verification Status */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Verification Status</label>
                      <div className="flex gap-2">
                        <StatusButton
                          active={filters.isVerified === true}
                          label="Verified"
                          onClick={() => updateFilter('isVerified', filters.isVerified === true ? null : true)}
                        />
                        <StatusButton
                          active={filters.isVerified === false}
                          label="Pending"
                          onClick={() => updateFilter('isVerified', filters.isVerified === false ? null : false)}
                        />
                      </div>
                    </div>

                    {/* Active Status */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Active Status</label>
                      <div className="flex gap-2">
                        <StatusButton
                          active={filters.isActive === true}
                          label="Active"
                          onClick={() => updateFilter('isActive', filters.isActive === true ? null : true)}
                        />
                        <StatusButton
                          active={filters.isActive === false}
                          label="Inactive"
                          onClick={() => updateFilter('isActive', filters.isActive === false ? null : false)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {countActiveFilters()} active filters
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFilter}
                  className="text-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={toggleFilter}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 