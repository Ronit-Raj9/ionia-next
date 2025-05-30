"use client";
import React from "react";
import { useAnalysisStore } from '@/stores/analysisStore';

interface TabsProps {
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ children }) => {
  const { activeTab, setActiveTab } = useAnalysisStore();

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'questions', label: 'Questions' },
    { id: 'subjects', label: 'Subjects' },
  ];

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {React.Children.toArray(children).find((child: any) => 
          child.props.id === activeTab
        )}
      </div>
    </div>
  );
};

export default Tabs;
