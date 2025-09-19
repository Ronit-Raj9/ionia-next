"use client";

import React from "react";
import { useAnalysisStore } from "@/features/analysis/store/analysisStore";

const QualityTimeSpent: React.FC = () => {
  const { currentAnalysis } = useAnalysisStore();

  if (!currentAnalysis) {
    return <div className="bg-gray-50 p-6 rounded-lg shadow text-center text-gray-500">No analysis data available.</div>;
  }

  // Calculate total time spent across all subjects
  const totalTimeSpent = currentAnalysis.timeAnalysis?.totalTime || 0;

  // Calculate average time per question
  const averageTimePerQuestion = currentAnalysis.timeAnalysis?.averageTimePerQuestion || 0;

  // Format time values (handle both seconds and milliseconds)
  const formatTime = (timeInSeconds: number) => {
    if (timeInSeconds < 60) {
      return `${Math.round(timeInSeconds)}s`;
    } else {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.round(timeInSeconds % 60);
      return `${minutes}m ${seconds}s`;
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Quality of Time Spent</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Total Time Spent</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {formatTime(totalTimeSpent)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Average Time per Question</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {formatTime(averageTimePerQuestion)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QualityTimeSpent;
