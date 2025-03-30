import React from 'react';
import { PlusCircle, MinusCircle, X } from 'lucide-react';
import { StepProps } from '../../utils/types';
import FileUpload from '../../inputs/FileUpload';

interface SolutionHintsProps extends StepProps {
  addHint: () => void;
  removeHint: (index: number) => void;
  addCommonMistake: () => void;
  removeCommonMistake: (index: number) => void;
}

const SolutionHints: React.FC<SolutionHintsProps> = ({
  formData,
  errors,
  handleInputChange,
  handleFileUpload,
  setErrors,
  addHint,
  removeHint,
  addCommonMistake,
  removeCommonMistake
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Solution & Hints</h2>
          <p className="text-xs text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>
      
      {/* Solution */}
      <div>
        <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-1">
          Solution <span className="text-red-500">*</span>
        </label>
        <div className="flex items-start gap-4">
          <div className="flex-grow">
            <textarea
              id="solution"
              name="solution.text"
              value={formData.solution.text}
              onChange={(e) => handleInputChange(e, 'solution', 'text')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] max-h-[120px] transition-shadow"
              placeholder="Explain the solution..."
            />
          </div>
          <div className="w-[180px] flex-shrink-0">
            <FileUpload
              onFileSelect={(file) => handleFileUpload(file, 'solutionImage')}
              label="Upload solution image (optional)"
              initialUrl={formData.solution.image?.url}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">Either Solution Text or Solution Image is required</p>
        {errors.solution && (
          <p className="mt-1 text-sm text-red-500">{errors.solution}</p>
        )}
      </div>
      
      {/* Hints */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Hints (Optional)</label>
          {formData.hints.length < 4 && (
            <button
              type="button"
              onClick={addHint}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <PlusCircle size={14} className="mr-1" />
              Add Hint
            </button>
          )}
        </div>
        
        {formData.hints.length > 0 ? (
          <div className="space-y-3">
            {formData.hints.map((hint, index) => (
              <div key={index} className="relative p-4 border rounded-lg bg-gray-50 mb-4">
                <button
                  type="button"
                  onClick={() => removeHint(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                >
                  <X size={14} />
                </button>
                
                <div className="mb-3">
                  <label htmlFor={`hint-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                    Hint {index + 1}
                  </label>
                  <textarea
                    id={`hint-${index}`}
                    name={`hint-${index}`}
                    rows={2}
                    value={hint.text}
                    onChange={(e) => handleInputChange(e, 'hints', 'text', index)}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder={`Enter hint ${index + 1}`}
                  />
                  {errors.hints && errors.hints[index] && (
                    <p className="text-red-500 text-xs mt-1">{errors.hints[index] as string}</p>
                  )}
                </div>
                
                <div className="w-1/3 mx-auto">
                  <FileUpload
                    onFileSelect={(file) => handleFileUpload(file, 'hintImage', index)}
                    label="Upload hint image (optional)"
                    initialUrl={hint.image?.url}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500">No hints added yet</p>
          </div>
        )}
      </div>
      
      {/* Common Mistakes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Common Mistakes (Optional)</label>
          <button
            type="button"
            onClick={addCommonMistake}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <PlusCircle size={14} className="mr-1" />
            Add Common Mistake
          </button>
        </div>
        
        {formData.commonMistakes.length > 0 ? (
          <div className="space-y-3">
            {formData.commonMistakes.map((mistake, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-800">Common Mistake #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeCommonMistake(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <MinusCircle size={16} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={mistake.description}
                      onChange={(e) => handleInputChange(e, 'commonMistakes', 'description', index)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      placeholder="What students might do wrong..."
                    />
                    {errors[`commonMistakes[${index}].description`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`commonMistakes[${index}].description`]}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Explanation
                    </label>
                    <textarea
                      value={mistake.explanation}
                      onChange={(e) => handleInputChange(e, 'commonMistakes', 'explanation', index)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px] transition-shadow"
                      placeholder="Why this is incorrect and how to avoid it..."
                    />
                    {errors[`commonMistakes[${index}].explanation`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`commonMistakes[${index}].explanation`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500">No common mistakes added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolutionHints; 