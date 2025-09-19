import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TagsTopicsProps {
  formData: {
    tags: string[];
    relatedTopics: string[];
    prerequisites: string[];
  };
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
}

const TagsTopics: React.FC<TagsTopicsProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  const [tagInput, setTagInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [prerequisiteInput, setPrerequisiteInput] = useState('');

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        onInputChange('tags', [...formData.tags, tag]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddTopic = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const topic = topicInput.trim();
      if (topic && !formData.relatedTopics.includes(topic)) {
        onInputChange('relatedTopics', [...formData.relatedTopics, topic]);
        setTopicInput('');
      }
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    onInputChange('relatedTopics', formData.relatedTopics.filter(topic => topic !== topicToRemove));
  };

  const handleAddPrerequisite = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const prerequisite = prerequisiteInput.trim();
      if (prerequisite && !formData.prerequisites.includes(prerequisite)) {
        onInputChange('prerequisites', [...formData.prerequisites, prerequisite]);
        setPrerequisiteInput('');
      }
    }
  };

  const handleRemovePrerequisite = (prerequisiteToRemove: string) => {
    onInputChange('prerequisites', formData.prerequisites.filter(prerequisite => prerequisite !== prerequisiteToRemove));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Tags & Topics</h2>
          <p className="text-xs text-gray-500 mt-1">All fields are optional</p>
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (Optional)
        </label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          placeholder="e.g., kinematics, vectors, energy"
        />
        <p className="mt-1 text-xs text-gray-500">
          Press Enter or Comma (,) to add new tags
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Tags help students search for questions. Use keywords describing the question.
        </p>
        
        {formData.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Related Topics Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Related Topics (Optional)
        </label>
        <input
          type="text"
          value={topicInput}
          onChange={(e) => setTopicInput(e.target.value)}
          onKeyDown={handleAddTopic}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          placeholder="e.g., Newton's Laws, Projectile Motion"
        />
        <p className="mt-1 text-xs text-gray-500">
          Press Enter or Comma (,) to add new topics
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Related topics are broader concepts this question covers.
        </p>
        
        {formData.relatedTopics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.relatedTopics.map((topic, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Prerequisites Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prerequisites (Optional)
        </label>
        <input
          type="text"
          value={prerequisiteInput}
          onChange={(e) => setPrerequisiteInput(e.target.value)}
          onKeyDown={handleAddPrerequisite}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          placeholder="e.g., basic calculus, differentiation"
        />
        <p className="mt-1 text-xs text-gray-500">
          Press Enter or Comma (,) to add new prerequisites
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Knowledge students should have before attempting this question.
        </p>
        
        {formData.prerequisites.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.prerequisites.map((prerequisite, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                {prerequisite}
                <button
                  type="button"
                  onClick={() => handleRemovePrerequisite(prerequisite)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagsTopics; 