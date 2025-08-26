"use client";

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';

interface EditPageTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

// Re-export the shared components for convenience
export { Tabs, TabsList, TabsTrigger, TabsContent };

// Main EditPageTabs Component
export const EditPageTabs: React.FC<EditPageTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  children 
}) => {
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-transparent border-b border-gray-200">
          <TabsTrigger
            value="edit"
            className="flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-500 hover:text-gray-700 transition-colors"
          >
            Edit Question
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-500 hover:text-gray-700 transition-colors"
          >
            Revision History
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-500 hover:text-gray-700 transition-colors"
          >
            Statistics
          </TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
};