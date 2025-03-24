"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks/hooks";
import { fetchTest, resetTest, startTest } from "@/redux/slices/testSlice";
import { RootState } from "@/redux/store";
import TestWindow from "@/components/test/TestWindow";
import { addNotification } from "@/redux/slices/uiSlice";
import { checkAuth, setRedirectTo } from "@/redux/slices/authSlice";

export default function TestPage() {
  const params = useParams();
  const { examType, subject, testId: paperId } = params || {};
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAppSelector((state: RootState) => state.auth);
  const { currentTest, loading, error } = useAppSelector((state: RootState) => state.test);

  // Check authentication and fetch test data
  useEffect(() => {
    dispatch(checkAuth());
    
    if (paperId && typeof paperId === 'string') {
      dispatch(fetchTest(paperId));
    }
    
    // Cleanup on unmount
    return () => {
      dispatch(resetTest());
    };
  }, [dispatch, paperId]);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      dispatch(setRedirectTo(`/exam/${examType}/${subject}/${paperId}`));
      dispatch(addNotification({
        message: "Please login to access the test",
        type: "warning"
      }));
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router, dispatch, examType, subject, paperId]);

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
