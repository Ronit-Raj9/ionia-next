"use client";

import React from 'react';
import { FileText, HelpCircle, BarChart3, Settings, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';

interface TestEditTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedQuestionsCount: number;
  children: {
    details: React.ReactNode;
    questions: React.ReactNode;
    analytics: React.ReactNode;
    settings: React.ReactNode;
    schedule?: React.ReactNode;
  };
  className?: string;
}

const TestEditTabs: React.FC<TestEditTabsProps> = ({
  activeTab,
  onTabChange,
  selectedQuestionsCount,
  children,
  className = ''
}) => {
  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-50 p-1">
          <TabsTrigger 
            value="details" 
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
          
          <TabsTrigger 
            value="questions" 
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <HelpCircle className="h-4 w-4" />
            Questions
            {selectedQuestionsCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedQuestionsCount}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          
          <TabsTrigger 
            value="schedule" 
            className="flex items-center gap-2 data-[state=active]:bg-white"
          >
            <Clock className="h-4 w-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="details" className="space-y-6">
            {children.details}
          </TabsContent>

          <TabsContent value="questions" className="space-y-6">
            {children.questions}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {children.analytics}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {children.settings}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            {children.schedule || (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Test Scheduling
                </h3>
                <p className="text-gray-600">
                  Schedule and manage test availability and timing settings.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Coming soon...
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TestEditTabs;