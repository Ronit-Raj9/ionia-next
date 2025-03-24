"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks/hooks";
import { RootState } from "@/redux/store";
import AnalysisWindow from "@/components/analysis/AnalysisWindow";
import { addNotification } from "@/redux/slices/uiSlice";
import { checkAuth, setRedirectTo } from "@/redux/slices/authSlice";

export default function ResultsPage() {
  const params = useParams();
  const { examType, subject, testId: paperId } = params || {};
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, loading: authLoading } = useAppSelector((state: RootState) => state.auth);
  const { results, isTestCompleted } = useAppSelector((state: RootState) => state.test);

  // Check authentication
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      dispatch(setRedirectTo(`/exam/${examType}/${subject}/${paperId}/results`));
      dispatch(addNotification({
        message: "Please login to view test results",
        type: "warning"
      }));
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router, dispatch, examType, subject, paperId]);

  // Redirect to test page if no results
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isTestCompleted && !results) {
      dispatch(addNotification({
        message: "No test results found. Please complete the test first.",
        type: "warning"
      }));
      router.push(`/exam/${examType}/${subject}/${paperId}`);
    }
  }, [isTestCompleted, results, router, authLoading, isAuthenticated, examType, subject, paperId, dispatch]);

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
