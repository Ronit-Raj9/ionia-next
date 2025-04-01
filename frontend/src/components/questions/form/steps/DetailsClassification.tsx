import React, { useEffect, useState } from 'react';
import { StepProps } from '../../utils/types';
import { 
  EXAM_TYPES, 
  CLASS_OPTIONS, 
  SUBJECTS, 
  DIFFICULTY_LEVELS, 
  LANGUAGE_LEVELS, 
  LANGUAGES,
  getSubjectSections,
  getChaptersForSubject,
  YEARS,
  SUBJECT_VALUES
} from '../../utils/constants';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const DetailsClassification: React.FC<StepProps> = ({
  formData,
  errors,
  handleInputChange,
  handleFileUpload,
  setErrors
}) => {
  // State for chapter options
  const [chapterOptions, setChapterOptions] = useState<Array<{value: string, label: string}>>([]);
  const [sectionOptions, setSectionOptions] = useState<Array<{value: string, label: string}>>([]);
  
  // Get sections and chapters from Redux store
  const { sections, chapters } = useSelector((state: RootState) => state.question);

  // Get available subjects based on exam type and class
  const getAvailableSubjects = () => {
    if (!formData.examType) return [];
    
    // If exam type is none or class is none, show all subjects
    if (formData.examType === 'none' || formData.class === 'none') {
      return SUBJECTS;
    }
    
    // Otherwise show subjects based on exam type
    return SUBJECT_VALUES[formData.examType as keyof typeof SUBJECT_VALUES] || [];
  };

  // Reset dependent fields when exam type changes
  useEffect(() => {
    if (formData.examType) {
      const availableSubjects = getAvailableSubjects();
      // If current subject is not available in new exam type, reset it
      if (!availableSubjects.some(s => s.value === formData.subject)) {
        handleInputChange(
          { target: { name: 'subject', value: '' }} as React.ChangeEvent<HTMLSelectElement>,
          'subject'
        );
      }
    }
  }, [formData.examType, formData.class]);

  // Update sections when subject changes
  useEffect(() => {
    if (formData.subject) {
      const sections = getSubjectSections(formData.subject);
      setSectionOptions(sections);
      
      // Reset section when subject changes
      handleInputChange(
        { target: { name: 'section', value: '' }} as React.ChangeEvent<HTMLSelectElement>,
        'section'
      );
      
      // Also reset chapter when subject changes
      handleInputChange(
        { target: { name: 'chapter', value: '' }} as React.ChangeEvent<HTMLSelectElement>,
        'chapter'
      );
    } else {
      setSectionOptions([]);
      handleInputChange(
        { target: { name: 'section', value: '' }} as React.ChangeEvent<HTMLSelectElement>,
        'section'
      );
    }
  }, [formData.subject]);

  // Update chapters when subject, class, or section changes
  useEffect(() => {
    if (formData.subject && formData.section) {
      let options: Array<{value: string, label: string}> = [];
      
      if (formData.class === 'none') {
        // Get chapters from both class 11 and 12
        const class11Chapters = getChaptersForSubject(formData.subject, 'class_11', formData.section);
        const class12Chapters = getChaptersForSubject(formData.subject, 'class_12', formData.section);
        
        // Combine chapters and remove duplicates
        options = [...new Map([...class11Chapters, ...class12Chapters]
          .map(item => [item.value, item])).values()];
      } else {
        options = getChaptersForSubject(formData.subject, formData.class, formData.section);
      }
      
      setChapterOptions(options);
      
      // Reset chapter if it's not valid for new combination
      if (formData.chapter && !options.some(opt => opt.value === formData.chapter)) {
        handleInputChange(
          { target: { name: 'chapter', value: '' }} as React.ChangeEvent<HTMLSelectElement>,
          'chapter'
        );
      }
    } else {
      setChapterOptions([]);
      if (formData.chapter) {
        handleInputChange(
          { target: { name: 'chapter', value: '' }} as React.ChangeEvent<HTMLSelectElement>,
          'chapter'
        );
      }
    }
  }, [formData.subject, formData.class, formData.section]);

  // Get available chapters based on selected subject
  const availableChapters = formData.subject ? chapters[formData.subject.toLowerCase()] || [] : [];
  
  // Get available sections based on selected subject
  const availableSections = formData.subject ? sections[formData.subject.toLowerCase()] || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Details & Classification</h2>
          <p className="text-xs text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam Type <span className="text-red-500">*</span>
          </label>
          <select
            name="examType"
            className={`w-full p-2 border rounded-md ${errors.examType ? 'border-red-500' : 'border-gray-300'}`}
            value={formData.examType}
            onChange={(e) => handleInputChange(e, 'examType')}
          >
            <option value="">Select Exam Type</option>
            {EXAM_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.examType && (
            <p className="text-red-500 text-xs mt-1">{errors.examType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            name="class"
            className={`w-full p-2 border rounded-md ${errors.class ? 'border-red-500' : 'border-gray-300'}`}
            value={formData.class}
            onChange={(e) => handleInputChange(e, 'class')}
          >
            <option value="">Select Class</option>
            {CLASS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.class && (
            <p className="text-red-500 text-xs mt-1">{errors.class}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year {formData.questionSource === 'pyq' && <span className="text-red-500">*</span>}
          </label>
          <select
            value={formData.year}
            onChange={(e) => handleInputChange(e, 'year')}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="not applicable">Not Applicable</option>
            {YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {errors.year && (
            <p className="mt-1 text-sm text-red-500">{errors.year}</p>
          )}
        </div>
      </div>

      {/* Subject and Topic */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            name="subject"
            className={`w-full p-2 border rounded-md ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
            value={formData.subject}
            onChange={(e) => handleInputChange(e, 'subject')}
            disabled={!formData.examType}
          >
            <option value="">Select Subject</option>
            {getAvailableSubjects().map((subject) => (
              <option key={subject.value} value={subject.value}>
                {subject.label}
              </option>
            ))}
          </select>
          {!formData.examType && (
            <p className="text-gray-500 text-xs mt-1">Please select an exam type first</p>
          )}
          {errors.subject && (
            <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section <span className="text-red-500">*</span>
          </label>
          <select
            name="section"
            className={`w-full p-2 border rounded-md ${errors.section ? 'border-red-500' : 'border-gray-300'}`}
            value={formData.section}
            onChange={(e) => handleInputChange(e, 'section')}
          >
            <option value="">Select Section</option>
            {sectionOptions.map((section) => (
              <option key={section.value} value={section.value}>
                {section.label}
              </option>
            ))}
          </select>
          {errors.section && (
            <p className="text-red-500 text-xs mt-1">{errors.section}</p>
          )}
        </div>
      </div>

      {/* Chapter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chapter <span className="text-red-500">*</span>
        </label>
        <select
          name="chapter"
          className={`w-full p-2 border rounded-md ${errors.chapter ? 'border-red-500' : 'border-gray-300'}`}
          value={formData.chapter}
          onChange={(e) => handleInputChange(e, 'chapter')}
        >
          <option value="">Select Chapter</option>
          {chapterOptions.map((chapter) => (
            <option key={chapter.value} value={chapter.value}>
              {chapter.label}
            </option>
          ))}
        </select>
        {errors.chapter && (
          <p className="text-red-500 text-xs mt-1">{errors.chapter}</p>
        )}
      </div>

      {/* Difficulty and Language */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => handleInputChange(e, 'difficulty')}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.language}
            onChange={(e) => handleInputChange(e, 'language')}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {LANGUAGES.map(language => (
              <option key={language.value} value={language.value}>{language.label}</option>
            ))}
          </select>
          {errors.language && (
            <p className="mt-1 text-sm text-red-500">{errors.language}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language Level <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.languageLevel}
            onChange={(e) => handleInputChange(e, 'languageLevel')}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {LANGUAGE_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
          {errors.languageLevel && (
            <p className="mt-1 text-sm text-red-500">{errors.languageLevel}</p>
          )}
        </div>
      </div>

      {/* Marks and Time */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.marks}
            onChange={(e) => handleInputChange(e, 'marks')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
          {errors.marks && (
            <p className="mt-1 text-sm text-red-500">{errors.marks}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Negative Marks
          </label>
          <input
            type="number"
            max="0"
            value={formData.negativeMarks}
            onChange={(e) => handleInputChange(e, 'negativeMarks')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
          <p className="mt-1 text-xs text-gray-500">Enter as negative value (e.g., -0.25)</p>
          {errors.negativeMarks && (
            <p className="mt-1 text-sm text-red-500">{errors.negativeMarks}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Time (seconds)
          </label>
          <input
            type="number"
            min="0"
            value={formData.expectedTime}
            onChange={(e) => handleInputChange(e, 'expectedTime')}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
          <p className="mt-1 text-xs text-gray-500">Time students should take to solve (in seconds)</p>
        </div>
      </div>

      {/* Conceptual Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Conceptual Difficulty (1-10)
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="1"
            max="10"
            value={formData.conceptualDifficulty}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = parseInt(e.target.value);
              handleInputChange(e, 'conceptualDifficulty');
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-900">{formData.conceptualDifficulty}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Easy</span>
          <span className="text-xs text-gray-500">Hard</span>
        </div>
      </div>
    </div>
  );
};

export default DetailsClassification; 