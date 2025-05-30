"use client";

import React from "react";
import { useAnalysis } from "@/context/AnalysisContext";

const QualityTimeSpent: React.FC = () => {
  const { analysisData } = useAnalysis();

  if (!analysisData) {
    return <div className="bg-gray-50 p-6 rounded-lg shadow text-center text-gray-500">No analysis data available.</div>;
  }

  // Calculate total time spent across all subjects
  const totalTimeSpent = Object.values(analysisData.subjectWise).reduce(
    (total, subject) => total + subject.timeSpent,
    0
  );

  // Calculate average time per question
  const totalQuestions = Object.values(analysisData.subjectWise).reduce(
    (total, subject) => total + subject.total,
    0
  );
  const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Quality of Time Spent</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Total Time Spent</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {Math.round(totalTimeSpent / 1000)} seconds
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Average Time per Question</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {Math.round(averageTimePerQuestion / 1000)} seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default QualityTimeSpent;
