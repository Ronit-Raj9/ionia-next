"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useTestStore } from "@/features/tests/store/testStore";
import { useUIStore } from "@/stores/uiStore";
import AnalysisWindow from "@/features/analysis/components/AnalysisWindow";

export default function ResultsPage() {
  const params = useParams();
  const { examType, subject, testId: paperId } = params || {};
  const router = useRouter();
  
  const { isAuthenticated, isLoading: authLoading, validateAuth } = useAuthStore();
  const { results, isTestCompleted } = useTestStore();
  const { addNotification } = useUIStore();

  // Check authentication
  useEffect(() => {
    validateAuth();
  }, [validateAuth]);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      addNotification({
        title: "Authentication Required",
        message: "Please login to view test results",
        type: "warning"
      });
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router, addNotification, examType, subject, paperId]);

  // Redirect to test page if no results
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isTestCompleted && !results) {
      addNotification({
        title: "Test Not Complete",
        message: "No test results found. Please complete the test first.",
        type: "warning"
      });
      router.push(`/exam/${examType}/${subject}/${paperId}`);
    }
  }, [isTestCompleted, results, router, authLoading, isAuthenticated, examType, subject, paperId, addNotification]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (!results) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">No Results Found</h2>
          <p className="text-gray-600 mb-4">We couldn't find any results for this test.</p>
          <button 
            onClick={() => router.push(`/exam/${examType}/${subject}/${paperId}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Take Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-20">
      <AnalysisWindow 
        paperId={paperId as string} 
        examType={examType as string} 
        subject={subject as string} 
      />
    </div>
  );
}
