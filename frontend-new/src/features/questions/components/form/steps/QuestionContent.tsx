import React from 'react';
import Image from 'next/image';
import { PlusCircle, MinusCircle, Upload, X, CheckCircle } from 'lucide-react';
import { StepProps } from '../../utils/types';
import FileUpload from '../../inputs/FileUpload';
import { QUESTION_TYPES, QUESTION_CATEGORIES, QUESTION_SOURCES } from '../../utils/constants';

interface QuestionContentProps extends StepProps {
  handleCorrectOptionChange: (index: number) => void;
  addOption: () => void;
  removeOption: (index: number) => void;
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  formData,
  errors,
  handleInputChange,
  handleFileUpload,
  handleCorrectOptionChange,
  addOption,
  removeOption
}) => {
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
              name="question.text"
              value={formData.question.text}
              onChange={(e) => handleInputChange(e, 'question', 'text')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] transition-shadow"
              placeholder="Enter your question here..."
            />
          </div>
          <div className="w-32">
            <FileUpload
              onFileSelect={(file) => handleFileUpload(file, 'questionImage')}
              label="Question Image"
              initialUrl={formData.question.image?.url}
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
                    <FileUpload
                      onFileSelect={(file) => handleFileUpload(file, 'optionImage', index)}
                      label="Option Image"
                      initialUrl={option.image?.url}
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
          </div>
        )}
    </div>
  );
};

export default QuestionContent; 