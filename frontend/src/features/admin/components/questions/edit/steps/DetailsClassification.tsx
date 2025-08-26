import React from 'react';

interface DetailsClassificationProps {
  formData: {
    examType: string;
    class: string;
    year: string;
    subject: string;
    section: string;
    chapter: string;
    difficulty: 'easy' | 'medium' | 'hard';
    language: string;
    languageLevel: 'basic' | 'intermediate' | 'advanced';
    marks: number;
    negativeMarks: number;
    expectedTime: number;
    conceptualDifficulty: number;
  };
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
}

const EXAM_TYPES = [
  { value: 'jee_main', label: 'JEE Main' },
  { value: 'jee_advanced', label: 'JEE Advanced' },
  { value: 'cuet', label: 'CUET' },
  { value: 'neet', label: 'NEET' }
];

const CLASSES = [
  { value: 'class_11', label: 'Class 11' },
  { value: 'class_12', label: 'Class 12' }
];

const YEARS = [
  { value: 'not applicable', label: 'Not Applicable' },
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
  { value: '2021', label: '2021' },
  { value: '2020', label: '2020' }
];

const SUBJECTS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' }
];

const SECTIONS = [
  { value: 'select_section', label: 'Select Section' },
  { value: 'algebra', label: 'Algebra' },
  { value: 'calculus', label: 'Calculus' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'trigonometry', label: 'Trigonometry' }
];

const CHAPTERS = [
  { value: 'select_chapter', label: 'Select Chapter' },
  { value: 'sets_and_relations', label: 'Sets and Relations' },
  { value: 'functions', label: 'Functions' },
  { value: 'complex_numbers', label: 'Complex Numbers' },
  { value: 'quadratic_equations', label: 'Quadratic Equations' }
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' }
];

const LANGUAGE_LEVELS = [
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const DetailsClassification: React.FC<DetailsClassificationProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Details & Classification</h2>
          <p className="text-xs text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      {/* Row 1: Exam Type, Class, Year */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.examType}
            onChange={(e) => onInputChange('examType', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.class}
            onChange={(e) => onInputChange('class', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Select Class</option>
            {CLASSES.map(cls => (
              <option key={cls.value} value={cls.value}>{cls.label}</option>
            ))}
          </select>
          {errors.class && (
            <p className="mt-1 text-sm text-red-500">{errors.class}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            value={formData.year}
            onChange={(e) => onInputChange('year', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {YEARS.map(year => (
              <option key={year.value} value={year.value}>{year.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Subject, Section */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.subject}
            onChange={(e) => onInputChange('subject', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.section}
            onChange={(e) => onInputChange('section', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {SECTIONS.map(section => (
              <option key={section.value} value={section.value}>{section.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Chapter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chapter <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.chapter}
          onChange={(e) => onInputChange('chapter', e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          {CHAPTERS.map(chapter => (
            <option key={chapter.value} value={chapter.value}>{chapter.label}</option>
          ))}
        </select>
      </div>

      {/* Row 4: Difficulty, Language, Language Level */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.difficulty}
            onChange={(e) => onInputChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {DIFFICULTIES.map(difficulty => (
              <option key={difficulty.value} value={difficulty.value}>{difficulty.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.language}
            onChange={(e) => onInputChange('language', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {LANGUAGES.map(language => (
              <option key={language.value} value={language.value}>{language.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language Level <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.languageLevel}
            onChange={(e) => onInputChange('languageLevel', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {LANGUAGE_LEVELS.map(level => (
              <option key={level.value} value={level.value}>{level.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 5: Marks, Negative Marks, Expected Time */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.marks}
            onChange={(e) => onInputChange('marks', parseInt(e.target.value))}
            min="1"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
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
            value={formData.negativeMarks}
            onChange={(e) => onInputChange('negativeMarks', parseFloat(e.target.value))}
            step="0.25"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
          <p className="mt-1 text-xs text-gray-500">Enter as negative value (e.g., -0.25)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Time (seconds)
          </label>
          <input
            type="number"
            value={formData.expectedTime}
            onChange={(e) => onInputChange('expectedTime', parseInt(e.target.value))}
            min="30"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
          <p className="mt-1 text-xs text-gray-500">Time students should take to solve (in seconds)</p>
        </div>
      </div>

      {/* Row 6: Conceptual Difficulty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Conceptual Difficulty (1-10)
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="1"
            max="10"
            value={formData.conceptualDifficulty}
            onChange={(e) => onInputChange('conceptualDifficulty', parseInt(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <span className="text-sm font-medium text-gray-700 min-w-[2rem] text-center">
            {formData.conceptualDifficulty}
          </span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Easy</span>
          <span>Hard</span>
        </div>
      </div>
    </div>
  );
};

export default DetailsClassification; 