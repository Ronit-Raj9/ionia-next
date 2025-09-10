import React, { useState } from 'react';
import CurriculumDisplay from './CurriculumDisplay';

interface ViewAllChaptersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ViewAllChaptersModal: React.FC<ViewAllChaptersModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'physics' | 'chemistry' | 'biology'>('physics');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Curriculum Reference</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'physics' 
                ? 'text-emerald-600 border-b-2 border-emerald-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('physics')}
          >
            Physics
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'chemistry' 
                ? 'text-emerald-600 border-b-2 border-emerald-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('chemistry')}
          >
            Chemistry
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'biology' 
                ? 'text-emerald-600 border-b-2 border-emerald-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('biology')}
          >
            Biology
          </button>
        </div>
        
        {/* Curriculum Display */}
        <div className="curriculum-content">
          <CurriculumDisplay subject={activeTab} />
        </div>
        
        <div className="mt-6 text-center">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAllChaptersModal; 