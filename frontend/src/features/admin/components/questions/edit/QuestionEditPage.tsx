"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getQuestionById } from '@/features/admin/api/questionApi';
import type { Question } from '@/features/admin/types';
import { EditPageHeader, QuestionInfoBadges, EditPageTabs, TabsContent } from './index';
import QuestionEditForm from './QuestionEditForm';
import RevisionHistory from './RevisionHistory';
import QuestionStatistics from './QuestionStatistics';

interface QuestionEditPageProps {
  questionId: string;
}

const QuestionEditPage: React.FC<QuestionEditPageProps> = ({ questionId }) => {
  const router = useRouter();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('edit');

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getQuestionById(questionId);
        setQuestion(data);
      } catch (err) {
        console.error('Error fetching question:', err);
        setError(err instanceof Error ? err.message : 'Failed to load question');
      } finally {
        setLoading(false);
      }
    };

    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  const handleBackToQuestions = () => {
    router.push('/admin/questions');
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setQuestion(updatedQuestion);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-lg">Loading question data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-block">
                <p className="text-lg font-medium">Error loading question</p>
                <p className="mt-2">{error}</p>
              </div>
              <button
                onClick={handleBackToQuestions}
                className="mt-6 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                Return to Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg inline-block">
                <p className="text-lg font-medium">Question not found</p>
              </div>
              <button
                onClick={handleBackToQuestions}
                className="mt-6 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                Return to Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <EditPageHeader
          questionId={questionId}
          onBackToQuestions={handleBackToQuestions}
        />

        {/* Question Info Badges */}
        <QuestionInfoBadges question={question} />

        {/* Main Content with Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <EditPageTabs activeTab={activeTab} onTabChange={handleTabChange}>
            <TabsContent value="edit" className="p-6">
              <QuestionEditForm
                question={question}
                onQuestionUpdate={handleQuestionUpdate}
              />
            </TabsContent>

            <TabsContent value="history" className="p-6">
              <RevisionHistory questionId={questionId} />
            </TabsContent>

            <TabsContent value="stats" className="p-6">
              <QuestionStatistics questionId={questionId} />
            </TabsContent>
          </EditPageTabs>
        </div>
      </div>
    </div>
  );
};

export default QuestionEditPage;
