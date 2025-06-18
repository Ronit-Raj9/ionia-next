"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useTestStore } from "@/features/tests/store/testStore";
import { useUIStore } from "@/stores/uiStore";
import TestWindow from "@/features/tests/components/TestWindow";

export default function TestPage() {
  const params = useParams();
  const { examType, subject, testId: paperId } = params || {};
  
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, getCurrentUser } = useAuthStore();
  const { currentTest, loading, error, fetchTest, resetTest } = useTestStore();
  const { addNotification } = useUIStore();

  // Check authentication and fetch test data
  useEffect(() => {
    getCurrentUser();
    
    if (paperId && typeof paperId === 'string') {
      fetchTest(paperId);
    }
    
    // Cleanup on unmount
    return () => {
      resetTest();
    };
  }, [getCurrentUser, fetchTest, resetTest, paperId]);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!currentTest) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p>Test not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-0 md:p-4 min-h-screen">
      <TestWindow 
        examType={examType as string} 
        paperId={paperId as string} 
        subject={subject as string}
      />
    </div>
  );
}
