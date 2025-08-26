import React from 'react';
import { PlusCircle, MinusCircle, Upload } from 'lucide-react';

interface QuestionContentProps {
  formData: {
    questionText: string;
    questionType: 'mcq' | 'numerical' | 'assertion';
    questionCategory: 'theoretical' | 'numerical' | 'conceptual';
    questionSource: 'pyq' | 'custom' | 'platform';
    options: Array<{
      text: string;
      image?: File | null;
      isCorrect: boolean;
    }>;
    questionImage?: File | null;
  };
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onOptionChange: (index: number, field: string, value: any) => void;
  onCorrectOptionChange: (index: number) => void;
  onFileUpload: (file: File | null, field: string, index?: number) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Single Choice' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'assertion', label: 'Assertion' }
];

const QUESTION_CATEGORIES = [
  { value: 'theoretical', label: 'Theoretical' },
  { value: 'numerical', label: 'Numerical' },
  { value: 'conceptual', label: 'Conceptual' }
];

const QUESTION_SOURCES = [
  { value: 'pyq', label: 'Previous Year Question' },
  { value: 'custom', label: 'Custom' },
  { value: 'platform', label: 'Platform' }
];

const QuestionContent: React.FC<QuestionContentProps> = ({
  formData,
  errors,
  onInputChange,
  onOptionChange,
  onCorrectOptionChange,
  onFileUpload,
  onAddOption,
  onRemoveOption
}) => {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, field: string, index?: number) => {
    const file = event.target.files?.[0] || null;
    onFileUpload(file, field, index);
  };

  return (
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
            onChange={(e) => onInputChange('questionType', e.target.value)}
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
            onChange={(e) => onInputChange('questionCategory', e.target.value)}
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
            onChange={(e) => onInputChange('questionSource', e.target.value)}
            className="px-3 py-2 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {QUESTION_SOURCES.map(source => (
              <option key={source.value} value={source.value}>{source.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="questionText" className="block text-sm font-medium text-gray-700 mb-1">
          Question Text <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-3">
          <div className="flex-grow">
            <textarea
              id="questionText"
              value={formData.questionText}
              onChange={(e) => onInputChange('questionText', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] transition-shadow"
              placeholder="Enter your question here..."
            />
          </div>
          <div className="w-32">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'questionImage')}
                className="hidden"
                id="questionImage"
              />
              <label htmlFor="questionImage" className="cursor-pointer">
                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Click to upload</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
              </label>
            </div>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">Either Question Text or Question Image is required</p>
        {errors.questionText && (
          <p className="mt-1 text-sm text-red-500">{errors.questionText}</p>
        )}
      </div>

      {formData.questionType !== 'numerical' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Options <span className="text-red-500">*</span></label>
            {formData.options.length < 6 && (
              <button
                type="button"
                onClick={onAddOption}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <PlusCircle size={14} className="mr-1" />
                Add Option
              </button>
            )}
          </div>
          
          {errors.correctOptions && (
            <p className="text-sm text-red-500">{errors.correctOptions}</p>
          )}
          
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 cursor-pointer transition-colors ${
                        option.isCorrect
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      onClick={() => onCorrectOptionChange(index)}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {option.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onRemoveOption(index)}
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
                    onChange={(e) => onOptionChange(index, 'text', e.target.value)}
                    className="flex-grow px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                  
                  <div className="w-24">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-gray-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'optionImage', index)}
                        className="hidden"
                        id={`optionImage${index}`}
                      />
                      <label htmlFor={`optionImage${index}`} className="cursor-pointer">
                        <Upload className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Click to upload</p>
                        <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                      </label>
                    </div>
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
                value={formData.exactValue || 0}
                onChange={(e) => onInputChange('exactValue', parseFloat(e.target.value))}
                step="any"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit (optional)
              </label>
              <input
                type="text"
                value={formData.unit || ''}
                onChange={(e) => onInputChange('unit', e.target.value)}
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
                value={formData.rangeMin || 0}
                onChange={(e) => onInputChange('rangeMin', parseFloat(e.target.value))}
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
                value={formData.rangeMax || 0}
                onChange={(e) => onInputChange('rangeMax', parseFloat(e.target.value))}
                step="any"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionContent; 