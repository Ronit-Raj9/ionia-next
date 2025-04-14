"use client";

import React from 'react';
import { ArrowLeftIcon, MoonIcon, SunIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface NavigationBarProps {
  testInfo: any;
  filter: 'all' | 'correct' | 'incorrect' | 'skipped' | 'bookmarked';
  setFilter: (filter: 'all' | 'correct' | 'incorrect' | 'skipped' | 'bookmarked') => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  readingMode: boolean;
  toggleReadingMode: () => void;
  backToAnalysis: () => void;
}

const SolutionNavigationBar: React.FC<NavigationBarProps> = ({
  testInfo,
  filter,
  setFilter,
  darkMode,
  toggleDarkMode,
  readingMode,
  toggleReadingMode,
  backToAnalysis,
}) => {
  return (
    <div className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Section - Back Button & Test Info */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={backToAnalysis}
              className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-1" />
              Back to Analysis
            </button>
            
            <div className="hidden md:block border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
            
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold">
                {testInfo.testTitle || 'Test Solutions'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {testInfo.examType} • {testInfo.duration && `${Math.floor(testInfo.duration / 60)} mins`}
              </p>
            </div>
          </div>

          {/* Mobile Title - Only visible on mobile */}
          <div className="md:hidden text-center w-full">
            <h2 className="text-lg font-semibold">
              {testInfo.testTitle || 'Test Solutions'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {testInfo.examType} • {testInfo.duration && `${Math.floor(testInfo.duration / 60)} mins`}
            </p>
          </div>
          
          {/* Right Section - Filters & Toggles */}
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-center md:justify-end">
            {/* Filters */}
            <div className="flex gap-2 flex-wrap justify-center">
              <FilterButton 
                label="All" 
                active={filter === 'all'} 
                onClick={() => setFilter('all')} 
                darkMode={darkMode}
              />
              <FilterButton 
                label="Correct" 
                active={filter === 'correct'} 
                onClick={() => setFilter('correct')} 
                darkMode={darkMode}
              />
              <FilterButton 
                label="Incorrect" 
                active={filter === 'incorrect'} 
                onClick={() => setFilter('incorrect')} 
                darkMode={darkMode}
              />
              <FilterButton 
                label="Skipped" 
                active={filter === 'skipped'} 
                onClick={() => setFilter('skipped')} 
                darkMode={darkMode}
              />
              <FilterButton 
                label="Bookmarked" 
                active={filter === 'bookmarked'} 
                onClick={() => setFilter('bookmarked')} 
                darkMode={darkMode}
              />
            </div>

            <div className="flex gap-2">
              {/* Reading Mode Toggle */}
              <button
                onClick={toggleReadingMode}
                className={`p-2 rounded-full transition-colors ${
                  readingMode 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title={readingMode ? 'Exit Reading Mode' : 'Enter Reading Mode'}
              >
                <BookOpenIcon className="w-5 h-5" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full transition-colors ${
                  darkMode 
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for filter buttons
const FilterButton: React.FC<{ 
  label: string; 
  active: boolean; 
  onClick: () => void;
  darkMode: boolean;
}> = ({ label, active, onClick, darkMode }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : darkMode
            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
};

export default SolutionNavigationBar; 