import React, { useState, useEffect } from 'react';
import { 
  getSubjectSections,
  getChaptersForSubject,
  SECTION_DISPLAY_NAMES
} from '../utils/constants';
import { QuestionFormData } from '../utils/types';

interface SectionSelectorProps {
  formData: QuestionFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, field: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<QuestionFormData>>;
  subjectKey?: string;
}

const SectionSelector: React.FC<SectionSelectorProps> = ({ 
  formData, 
  handleInputChange,
  setFormData,
  subjectKey 
}) => {
  const [availableChapters, setAvailableChapters] = useState<Array<{value: string, label: string}>>([]);
  
  // Update chapters when subject, class, or section changes
  useEffect(() => {
    if (formData.subject && formData.section) {
      let chapters: Array<{value: string, label: string}> = [];
      
      // If class is none, get chapters from both class 11 and 12
      if (formData.class === 'none') {
        const class11Chapters = getChaptersForSubject(formData.subject, 'class_11', formData.section);
        const class12Chapters = getChaptersForSubject(formData.subject, 'class_12', formData.section);
        chapters = [...new Set([...class11Chapters, ...class12Chapters])];
      } else {
        chapters = getChaptersForSubject(formData.subject, formData.class, formData.section);
      }
      
      setAvailableChapters(chapters);
      
      // Reset chapter if it's not valid for new combination
      if (formData.chapter && !chapters.some(ch => ch.value === formData.chapter)) {
        setFormData(prev => ({ ...prev, chapter: "" }));
      }
    } else {
      setAvailableChapters([]);
      if (formData.chapter) {
        setFormData(prev => ({ ...prev, chapter: "" }));
      }
    }
  }, [formData.subject, formData.class, formData.section]);
  
  // Get available sections based on subject
  const sections = formData.subject ? getSubjectSections(formData.subject) : [];
  
  return (
    <div className="space-y-4">
      {/* Section selection */}
      {formData.subject && (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section <span className="text-red-500">*</span>
          </label>
          <select 
            name="section"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={formData.section} 
            onChange={(e) => {
              handleInputChange(e, 'section');
              // Reset chapter when section changes
              setFormData(prev => ({ ...prev, chapter: "" }));
            }}
          >
            <option value="">Select Section</option>
            {sections.map(section => (
              <option key={section.value} value={section.value}>
                {section.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Chapter selection - only show if section is selected */}
      {formData.subject && formData.section && (
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chapter <span className="text-red-500">*</span>
          </label>
          <select
            name="chapter"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={formData.chapter}
            onChange={(e) => handleInputChange(e, 'chapter')}
          >
            <option value="">Select Chapter</option>
            {availableChapters.map((chapter) => (
              <option key={chapter.value} value={chapter.value}>
                {chapter.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default SectionSelector; 