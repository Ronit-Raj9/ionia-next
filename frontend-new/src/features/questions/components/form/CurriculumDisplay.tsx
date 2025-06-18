import React from 'react';
import { PHYSICS_CURRICULUM, CHEMISTRY_CURRICULUM, BIOLOGY_CURRICULUM, SECTION_DISPLAY_NAMES } from '../utils/constants';

interface CurriculumDisplayProps {
  subject: 'physics' | 'chemistry' | 'biology';
}

const CurriculumDisplay: React.FC<CurriculumDisplayProps> = ({ subject }) => {
  // Get the appropriate curriculum data based on the subject
  const getCurriculumData = () => {
    switch (subject) {
      case 'physics':
        return PHYSICS_CURRICULUM;
      case 'chemistry':
        return CHEMISTRY_CURRICULUM;
      case 'biology':
        return BIOLOGY_CURRICULUM;
      default:
        return PHYSICS_CURRICULUM;
    }
  };

  // Get display name for the subject
  const getSubjectDisplayName = () => {
    switch (subject) {
      case 'physics':
        return 'Physics';
      case 'chemistry':
        return 'Chemistry';
      case 'biology':
        return 'Biology';
      default:
        return 'Physics';
    }
  };

  const curriculumData = getCurriculumData();

  return (
    <div className={`${subject}-curriculum`}>
      <h2 className="text-xl font-bold mb-4">{getSubjectDisplayName()} Curriculum</h2>
      
      {Object.entries(curriculumData).map(([classKey, sections]) => (
        <div key={classKey} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">
            {classKey === "class_11" ? "Class 11" : "Class 12"}
          </h3>
          
          {Object.entries(sections).map(([sectionKey, chapters]) => (
            <div key={sectionKey} className="mb-4 ml-4">
              <h4 className="font-medium mb-1">
                {SECTION_DISPLAY_NAMES[sectionKey as keyof typeof SECTION_DISPLAY_NAMES] || sectionKey}
              </h4>
              
              <ul className="list-disc ml-6">
                {(chapters as string[]).map((chapter: string, index: number) => (
                  <li key={index} className="text-sm">
                    {chapter}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CurriculumDisplay; 