"use client";

import React from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { FilterState, AvailableOptions } from '../questions/types';
import { MultiSelect } from '../MultiSelect';

interface TestQuestionFiltersProps {
  filters: FilterState;
  availableOptions: AvailableOptions;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  className?: string;
}

const TestQuestionFilters: React.FC<TestQuestionFiltersProps> = ({
  filters,
  availableOptions,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const updateFilter = (field: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.examType.length > 0) count++;
    if (filters.year.length > 0) count++;
    if (filters.subject.length > 0) count++;
    if (filters.chapter.length > 0) count++;
    if (filters.difficulty.length > 0) count++;
    if (filters.questionType.length > 0) count++;
    if (filters.questionCategory.length > 0) count++;
    if (filters.questionSource.length > 0) count++;
    if (filters.section.length > 0) count++;
    if (filters.languageLevel.length > 0) count++;
    if (filters.class.length > 0) count++;
    if (filters.isVerified !== null) count++;
    if (filters.isActive !== null) count++;
    if (filters.marks.min !== null || filters.marks.max !== null) count++;
    if (filters.negativeMarks.min !== null || filters.negativeMarks.max !== null) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className={`border-blue-200 ${className}`}>
      <CardContent className="p-4">
        {/* Search and Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} questions
          </div>
          
          {activeFiltersCount > 0 && (
            <div className="text-sm text-blue-600">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-4 mt-4 p-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.subjects)}
                  selectedValues={filters.subject}
                  onChange={(values) => updateFilter('subject', values)}
                  placeholder="Select subjects"
                  maxDisplay={2}
                />
              </div>

              {/* Exam Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.examTypes)}
                  selectedValues={filters.examType}
                  onChange={(values) => updateFilter('examType', values)}
                  placeholder="Select exam types"
                  maxDisplay={2}
                />
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.classes)}
                  selectedValues={filters.class}
                  onChange={(values) => updateFilter('class', values)}
                  placeholder="Select classes"
                  maxDisplay={2}
                />
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.difficulties)}
                  selectedValues={filters.difficulty}
                  onChange={(values) => updateFilter('difficulty', values)}
                  placeholder="Select difficulty"
                  maxDisplay={2}
                />
              </div>

              {/* Question Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.questionTypes)}
                  selectedValues={filters.questionType}
                  onChange={(values) => updateFilter('questionType', values)}
                  placeholder="Select types"
                  maxDisplay={2}
                />
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.years)}
                  selectedValues={filters.year}
                  onChange={(values) => updateFilter('year', values)}
                  placeholder="Select years"
                  maxDisplay={2}
                />
              </div>

              {/* Chapter Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chapter
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.chapters)}
                  selectedValues={filters.chapter}
                  onChange={(values) => updateFilter('chapter', values)}
                  placeholder="Select chapters"
                  maxDisplay={2}
                />
              </div>

              {/* Section Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.sections)}
                  selectedValues={filters.section}
                  onChange={(values) => updateFilter('section', values)}
                  placeholder="Select sections"
                  maxDisplay={2}
                />
              </div>

              {/* Language Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language Level
                </label>
                <MultiSelect
                  options={Array.from(availableOptions.languageLevels)}
                  selectedValues={filters.languageLevel}
                  onChange={(values) => updateFilter('languageLevel', values)}
                  placeholder="Select levels"
                  maxDisplay={2}
                />
              </div>
            </div>

            {/* Marks Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marks Range
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.marks.min || ''}
                    onChange={(e) => updateFilter('marks', { 
                      ...filters.marks, 
                      min: e.target.value ? Number(e.target.value) : null 
                    })}
                    className="w-20"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.marks.max || ''}
                    onChange={(e) => updateFilter('marks', { 
                      ...filters.marks, 
                      max: e.target.value ? Number(e.target.value) : null 
                    })}
                    className="w-20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Negative Marks Range
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.negativeMarks.min || ''}
                    onChange={(e) => updateFilter('negativeMarks', { 
                      ...filters.negativeMarks, 
                      min: e.target.value ? Number(e.target.value) : null 
                    })}
                    className="w-20"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.negativeMarks.max || ''}
                    onChange={(e) => updateFilter('negativeMarks', { 
                      ...filters.negativeMarks, 
                      max: e.target.value ? Number(e.target.value) : null 
                    })}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            {/* Boolean Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Status
                </label>
                <select
                  value={filters.isVerified === null ? '' : filters.isVerified.toString()}
                  onChange={(e) => updateFilter('isVerified', 
                    e.target.value === '' ? null : e.target.value === 'true'
                  )}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Status
                </label>
                <select
                  value={filters.isActive === null ? '' : filters.isActive.toString()}
                  onChange={(e) => updateFilter('isActive', 
                    e.target.value === '' ? null : e.target.value === 'true'
                  )}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestQuestionFilters;