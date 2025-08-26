import React from 'react';
import { X } from 'lucide-react';
import { StepProps } from '../../utils/types';

interface TagsTopicsProps extends StepProps {
  handleTagInput: (e: React.KeyboardEvent<HTMLInputElement>, field: 'tags' | 'relatedTopics' | 'prerequisites') => void;
  removeTag: (index: number, field: 'tags' | 'relatedTopics' | 'prerequisites') => void;
  handleArrayField: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  addCommonMistake: () => void;
  removeCommonMistake: (index: number) => void;
  clearFormData: () => void;
}

const TagsTopics: React.FC<TagsTopicsProps> = ({
  formData,
  errors,
  handleInputChange,
  handleArrayField,
  handleTagInput,
  removeTag,
  addCommonMistake,
  removeCommonMistake,
  clearFormData
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Tags & Topics</h2>
          <p className="text-xs text-gray-500 mt-1">
            Press Enter or Comma (,) to add new tags
          </p>
        </div>
      </div>
      
      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags (Optional)
        </label>
        <div className="border rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map((tag, index) => (
              <div 
                key={index} 
                className="flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index, 'tags')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <input
            id="tags"
            type="text"
            onKeyDown={(e) => handleTagInput(e, 'tags')}
            className="w-full px-1 py-1 outline-none text-sm"
            placeholder={formData.tags.length ? "" : "Add tags (e.g., kinematics, vectors, energy)"}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Tags help students search for questions. Use keywords describing the question.
        </p>
      </div>
      
      {/* Related Topics */}
      <div>
        <label htmlFor="relatedTopics" className="block text-sm font-medium text-gray-700 mb-1">
          Related Topics (Optional)
        </label>
        <div className="border rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.relatedTopics.map((topic, index) => (
              <div 
                key={index} 
                className="flex items-center bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
              >
                <span>{topic}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index, 'relatedTopics')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <input
            id="relatedTopics"
            type="text"
            onKeyDown={(e) => handleTagInput(e, 'relatedTopics')}
            className="w-full px-1 py-1 outline-none text-sm"
            placeholder={formData.relatedTopics.length ? "" : "Add related topics (e.g., Newton's Laws, Projectile Motion)"}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Related topics are broader concepts this question covers.
        </p>
      </div>
      
      {/* Prerequisites */}
      <div>
        <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700 mb-1">
          Prerequisites (Optional)
        </label>
        <div className="border rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.prerequisites.map((prereq, index) => (
              <div 
                key={index} 
                className="flex items-center bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full"
              >
                <span>{prereq}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index, 'prerequisites')}
                  className="ml-1 text-amber-600 hover:text-amber-800"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <input
            id="prerequisites"
            type="text"
            onKeyDown={(e) => handleTagInput(e, 'prerequisites')}
            className="w-full px-1 py-1 outline-none text-sm"
            placeholder={formData.prerequisites.length ? "" : "Add prerequisites (e.g., basic calculus, differentiation)"}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Knowledge students should have before attempting this question.
        </p>
      </div>
      
      {/* Form Management */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={clearFormData}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          >
            Reset Form
          </button>
          
          <div className="space-x-3">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              onClick={() => {
                const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify(formData, null, 2)
                )}`;
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute('href', dataStr);
                downloadAnchorNode.setAttribute('download', 'question_draft.json');
                document.body.appendChild(downloadAnchorNode);
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
              }}
            >
              Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagsTopics; 