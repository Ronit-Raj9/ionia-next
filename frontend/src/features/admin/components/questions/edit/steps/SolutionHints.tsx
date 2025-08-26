import React from 'react';
import { PlusCircle, MinusCircle, Upload } from 'lucide-react';

interface SolutionHintsProps {
  formData: {
    solutionText: string;
    solutionImage?: File | null;
    hints: Array<{
      text: string;
      image?: File | null;
    }>;
    commonMistakes: Array<{
      description: string;
    }>;
  };
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onFileUpload: (file: File | null, field: string, index?: number) => void;
}

const SolutionHints: React.FC<SolutionHintsProps> = ({
  formData,
  errors,
  onInputChange,
  onFileUpload
}) => {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, field: string, index?: number) => {
    const file = event.target.files?.[0] || null;
    onFileUpload(file, field, index);
  };

  const addHint = () => {
    const newHints = [...formData.hints, { text: '', image: null }];
    onInputChange('hints', newHints);
  };

  const removeHint = (index: number) => {
    const newHints = formData.hints.filter((_, i) => i !== index);
    onInputChange('hints', newHints);
  };

  const updateHint = (index: number, field: string, value: any) => {
    const newHints = formData.hints.map((hint, i) => 
      i === index ? { ...hint, [field]: value } : hint
    );
    onInputChange('hints', newHints);
  };

  const addCommonMistake = () => {
    const newMistakes = [...formData.commonMistakes, { description: '' }];
    onInputChange('commonMistakes', newMistakes);
  };

  const removeCommonMistake = (index: number) => {
    const newMistakes = formData.commonMistakes.filter((_, i) => i !== index);
    onInputChange('commonMistakes', newMistakes);
  };

  const updateCommonMistake = (index: number, value: string) => {
    const newMistakes = formData.commonMistakes.map((mistake, i) => 
      i === index ? { ...mistake, description: value } : mistake
    );
    onInputChange('commonMistakes', newMistakes);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Solution & Hints</h2>
          <p className="text-xs text-gray-500 mt-1">Fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>

      {/* Solution Section */}
      <div>
        <label htmlFor="solutionText" className="block text-sm font-medium text-gray-700 mb-1">
          Solution <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-3">
          <div className="flex-grow">
            <textarea
              id="solutionText"
              value={formData.solutionText}
              onChange={(e) => onInputChange('solutionText', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] transition-shadow"
              placeholder="Enter the solution here..."
            />
          </div>
          <div className="w-32">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'solutionImage')}
                className="hidden"
                id="solutionImage"
              />
              <label htmlFor="solutionImage" className="cursor-pointer">
                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Click to upload</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
              </label>
            </div>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">Either Solution Text or Solution Image is required</p>
        {errors.solutionText && (
          <p className="mt-1 text-sm text-red-500">{errors.solutionText}</p>
        )}
      </div>

      {/* Hints Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Hints (Optional)
          </label>
          <button
            type="button"
            onClick={addHint}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <PlusCircle size={14} className="mr-1" />
            Add Hint
          </button>
        </div>

        {formData.hints.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">No hints added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.hints.map((hint, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Hint {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeHint(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <MinusCircle size={16} />
                  </button>
                </div>
                <div className="flex space-x-3">
                  <div className="flex-grow">
                    <textarea
                      value={hint.text}
                      onChange={(e) => updateHint(index, 'text', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] transition-shadow"
                      placeholder={`Enter hint ${index + 1}...`}
                    />
                  </div>
                  <div className="w-24">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-gray-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'hintImage', index)}
                        className="hidden"
                        id={`hintImage${index}`}
                      />
                      <label htmlFor={`hintImage${index}`} className="cursor-pointer">
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
        )}
      </div>

      {/* Common Mistakes Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Common Mistakes (Optional)
          </label>
          <button
            type="button"
            onClick={addCommonMistake}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <PlusCircle size={14} className="mr-1" />
            Add Common Mistake
          </button>
        </div>

        {formData.commonMistakes.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500">No common mistakes added yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.commonMistakes.map((mistake, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Common Mistake {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeCommonMistake(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <MinusCircle size={16} />
                  </button>
                </div>
                <textarea
                  value={mistake.description}
                  onChange={(e) => updateCommonMistake(index, e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] transition-shadow"
                  placeholder={`Describe common mistake ${index + 1}...`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SolutionHints; 