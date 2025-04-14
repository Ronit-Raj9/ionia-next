"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks/hooks";
import { RootState } from "@/redux/store";
import { fetchTestHistory } from "@/redux/slices/testSlice";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FiBarChart2, FiClock, FiCalendar, FiChevronRight } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { motion } from "framer-motion";

// Mock test data for testing/development
const mockTestData = {
  "65fd01a2b6a5c4e8b2d93f1a": {
    paperId: "65fd01a2b6a5c4e8b2d93f1a",
    score: 78,
    correctAnswers: 39,
    incorrectAnswers: 11,
    unattempted: 5,
    timeTaken: 4200
  },
  "65fe12b3c7d8e9f0a1b2c3d4": {
    paperId: "65fe12b3c7d8e9f0a1b2c3d4",
    score: 85,
    correctAnswers: 42,
    incorrectAnswers: 8,
    unattempted: 0,
    timeTaken: 3600
  },
  "65ff23c4d8e9f0a1b2c3d4e5": {
    paperId: "65ff23c4d8e9f0a1b2c3d4e5",
    score: 65,
    correctAnswers: 32,
    incorrectAnswers: 18,
    unattempted: 10,
    timeTaken: 5400
  }
};

export default function MyTests() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAppSelector((state: RootState) => state.auth);
  const { testHistory, loading: testHistoryLoading } = useAppSelector((state: RootState) => state.test);
  const [isLoaded, setIsLoaded] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      dispatch(fetchTestHistory())
        .then(() => {
          setIsLoaded(true);
          // If no test history is found, use mock data for development
          if (Object.keys(testHistory).length === 0) {
            console.log("No test history found, using mock data");
            setUseMockData(true);
          }
        })
        .catch((error) => {
          console.error("Failed to fetch test history:", error);
          // Use mock data if there's an error
          setUseMockData(true);
        });
    }
  }, [isAuthenticated, authLoading, dispatch, router, testHistory]);

  // Calculate and format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60) || 0;
    const remainingSeconds = seconds % 60 || 0;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format date from ObjectId timestamp
  const formatDate = (paperId: string) => {
    try {
      // Extract timestamp from MongoDB ObjectId (first 4 bytes)
      const timestamp = parseInt(paperId.substring(0, 8), 16) * 1000;
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Unknown Date";
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (err) {
      return "Unknown Date";
    }
  };

  const handleCardClick = (testId: string) => {
    router.push(`/dashboard/tests/${testId}`);
  };

  if (authLoading || testHistoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ClipLoader color="#10B981" size={40} />
      </div>
    );
  }

  // Use mock data or real data based on flag
  const displayData = useMockData ? mockTestData : testHistory;

  return (
    <div className="p-6 max-w-full">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          My Test History
        </h1>
        <p className="text-base text-gray-600 mt-2">
          View all your attempted tests and their analysis
        </p>
        {useMockData && (
          <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 text-sm rounded-md">
            Note: Showing sample test data for demonstration purposes.
          </div>
        )}
      </div>

      {Object.keys(displayData).length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <FiBarChart2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tests attempted yet</h3>
          <p className="text-gray-500 mb-6">You haven't attempted any tests. Start taking tests to see your performance here.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(displayData).map(([paperId, result]) => {
            // Calculate accuracy
            const accuracy = result.correctAnswers && (result.correctAnswers + result.incorrectAnswers) > 0 
              ? Math.round(result.correctAnswers / (result.correctAnswers + result.incorrectAnswers) * 100)
              : 0;
              
            return (
              <motion.div
                key={paperId}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="overflow-hidden cursor-pointer border border-gray-200 hover:border-emerald-200 transition-colors duration-300"
                  onClick={() => handleCardClick(paperId)}
                >
                  <CardHeader className="pb-2 bg-gradient-to-r from-emerald-50 to-emerald-100">
                    <CardTitle className="text-lg text-gray-800 flex justify-between items-center">
                      <span>Mock Test {paperId.substring(paperId.length - 4)}</span>
                      <span className="text-sm font-normal bg-white px-3 py-1 rounded-full text-emerald-600 border border-emerald-200">
                        {result.score}% Score
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                          <FiBarChart2 className="mr-2 text-emerald-500" size={14} />
                          <span>Accuracy</span>
                        </div>
                        <div className="font-semibold text-gray-800">{accuracy}%</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center text-gray-600 text-sm mb-1">
                          <FiClock className="mr-2 text-emerald-500" size={14} />
                          <span>Time Taken</span>
                        </div>
                        <div className="font-semibold text-gray-800">{formatTime(result.timeTaken || 0)}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 text-gray-400" size={14} />
                        <span>{formatDate(paperId)}</span>
                      </div>
                      <div>
                        {result.correctAnswers} correct / {result.incorrectAnswers} incorrect
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-end">
                    <div className="text-emerald-600 text-sm font-medium flex items-center">
                      View Analysis
                      <FiChevronRight className="ml-1" size={16} />
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
} 