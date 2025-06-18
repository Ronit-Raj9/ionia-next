"use client";

import { useState, useEffect } from "react";
import { Loader2, BarChart2, Users, Clock, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface QuestionStatisticsProps {
  questionId: string;
}

interface StatisticsData {
  timesAttempted: number;
  successRate: number;
  averageTimeTaken: number;
  totalAttempts: number;
  successPercentage: number;
}

const QuestionStatistics: React.FC<QuestionStatisticsProps> = ({ questionId }) => {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}/statistics`;
        
        const response = await fetch(apiUrl, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch question statistics");
        }

        const result = await response.json();
        setStatistics(result.data);
      } catch (err) {
        console.error("Error fetching question statistics:", err);
        setError(err instanceof Error ? err.message : "Failed to load statistics");
        toast.error("Failed to load question statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [questionId]);

  // Helper function to format time
  const formatTime = (seconds: number): string => {
    if (seconds === 0) return "0 seconds";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    
    if (mins === 0) return `${secs} seconds`;
    if (secs === 0) return `${mins} minutes`;
    return `${mins} minutes, ${secs} seconds`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-800 rounded-lg">
        <p className="font-medium">Error loading statistics</p>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">No statistics available for this question.</p>
      </div>
    );
  }

  // If the question has never been attempted
  if (statistics.timesAttempted === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center">
        <BarChart2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600">This question has not been attempted by any students yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-xl font-medium mb-6 text-gray-800 flex items-center">
        <BarChart2 className="mr-2 h-5 w-5" />
        Performance Metrics
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Total Attempts Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Attempts</p>
              <p className="text-2xl font-bold">{statistics.timesAttempted}</p>
            </div>
          </div>
        </div>
        
        {/* Success Rate Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        
        {/* Average Time Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Time Taken</p>
              <p className="text-2xl font-bold">{formatTime(statistics.averageTimeTaken)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Visual Representation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-6">
        <h4 className="text-lg font-medium mb-4 text-gray-700">Success Rate Visualization</h4>
        <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            style={{ width: `${statistics.successRate}%` }}
          ></div>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
            {statistics.successRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      
      {/* Interpretation */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-lg font-medium mb-2 text-blue-800">Performance Insights</h4>
        <p className="text-blue-700">
          {statistics.successRate < 30 
            ? "This question appears to be very challenging for students. Consider reviewing the difficulty level or providing additional hints."
            : statistics.successRate > 80
              ? "Most students are able to answer this question correctly. It may be effective for reinforcement but might not be challenging enough."
              : "This question has a balanced difficulty level that effectively differentiates student knowledge levels."
          }
        </p>
        {statistics.averageTimeTaken > 300 && (
          <p className="text-blue-700 mt-2">
            Students are taking longer than 5 minutes on average to solve this question, which may indicate it's more complex than intended.
          </p>
        )}
      </div>
    </div>
  );
};

export default QuestionStatistics; 