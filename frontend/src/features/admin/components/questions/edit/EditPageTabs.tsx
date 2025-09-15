"use client";

import React from 'react';

interface EditPageTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

// Main EditPageTabs Component
export const EditPageTabs: React.FC<EditPageTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  children 
}) => {
  const tabs = [
    { id: 'edit', label: 'Edit Question' },
    { id: 'history', label: 'Revision History' },
    { id: 'stats', label: 'Statistics' }
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="px-6">
          <nav className="flex" aria-label="Tabs">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-8 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white hover:shadow-sm'
                } ${index === 0 ? 'rounded-tl-lg' : ''} ${index === tabs.length - 1 ? 'rounded-tr-lg' : ''}`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-blue-500"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="w-full bg-white">
        {children}
      </div>
    </div>
  );
};

// Re-export shared components for convenience
export { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';