"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Loader2, History, BarChart2, CheckCircle } from "lucide-react";
import { Question } from "@/types/question";

// Import local components
import QuestionEditForm from "@/components/questions/edit/QuestionEditForm";
import RevisionHistory from "@/components/questions/edit/RevisionHistory";
import QuestionStatistics from "@/components/questions/edit/QuestionStatistics";

// Create a Tabs component since @/components/ui/tabs doesn't exist
const Tabs = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

const TabsList = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  return <div className={`flex space-x-4 border-b border-gray-200 ${className || ''}`}>{children}</div>;
};

const TabsTrigger = ({ 
  children, 
  value, 
  className,
  onClick 
}: { 
  children: React.ReactNode, 
  value: string, 
  className?: string,
  onClick?: () => void 
}) => {
  return (
    <button 
      className={`px-4 py-2 font-medium focus:outline-none ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ 
  children, 
  value, 
  className 
}: { 
  children: React.ReactNode, 
  value: string, 
  className?: string 
}) => {
  return <div className={className || ''}>{children}</div>;
};

export default function EditQuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("edit");
  
  const params = useParams();
  const router = useRouter();
  const questionId = typeof params.questionId === 'string' ? params.questionId : '';

  useEffect(() => {
    if (!questionId) return;
    
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}`;
        
        const response = await fetch(apiUrl, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch question");
        }

        const result = await response.json();
        setQuestion(result.data);
      } catch (err) {
        console.error("Error fetching question:", err);
        setError(err instanceof Error ? err.message : "Failed to load question");
        toast.error("Failed to load question");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId]);

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setQuestion(updatedQuestion);
    toast.success("Question updated successfully");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg">Loading question data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-block">
            <p className="text-lg font-medium">Error loading question</p>
            <p className="mt-2">{error}</p>
          </div>
          <button
            onClick={() => router.push("/admin/questions")}
            className="mt-6 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition"
          >
            Return to Questions
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg inline-block">
            <p className="text-lg font-medium">Question not found</p>
          </div>
          <button
            onClick={() => router.push("/admin/questions")}
            className="mt-6 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition"
          >
            Return to Questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Question</h1>
          <p className="mt-1 text-gray-600">
            ID: <span className="font-mono text-sm bg-gray-100 p-1 rounded">{questionId}</span>
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => router.push("/admin/questions")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
          >
            Back to Questions
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              {question.subject}
            </div>
            <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              {question.examType.replace('_', ' ').toUpperCase()}
            </div>
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </div>
            {question.isVerified && (
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Verified
              </div>
            )}
          </div>

          <Tabs>
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger 
                value="edit" 
                className={`flex items-center gap-2 ${activeTab === 'edit' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                onClick={() => handleTabChange('edit')}
              >
                <span className="hidden sm:inline-block">Edit Question</span>
                <span className="sm:hidden">Edit</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className={`flex items-center gap-2 ${activeTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                onClick={() => handleTabChange('history')}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline-block">Revision History</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className={`flex items-center gap-2 ${activeTab === 'stats' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                onClick={() => handleTabChange('stats')}
              >
                <BarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline-block">Statistics</span>
                <span className="sm:hidden">Stats</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className={`mt-0 ${activeTab !== 'edit' ? 'hidden' : ''}`}>
              <QuestionEditForm 
                question={question} 
                onQuestionUpdate={handleQuestionUpdate}
              />
            </TabsContent>

            <TabsContent value="history" className={`mt-0 ${activeTab !== 'history' ? 'hidden' : ''}`}>
              <RevisionHistory questionId={questionId} />
            </TabsContent>

            <TabsContent value="stats" className={`mt-0 ${activeTab !== 'stats' ? 'hidden' : ''}`}>
              <QuestionStatistics questionId={questionId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}