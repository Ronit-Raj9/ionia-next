"use client";

import React from "react";
import { useAnalysis } from "@/context/AnalysisContext";

const AttemptsAnalysis: React.FC = () => {
  const { analysisData } = useAnalysis();

  if (!analysisData) {
    return <div>No analysis data available.</div>;
  } 
   console.log("analysisData web page pe: ", analysisData);


  // Compute the attempt percentage as (questionsAttempted / totalQuestions) * 100
  const { questionsAttempted, totalQuestions } = analysisData;
  const attemptPercentage =
    totalQuestions > 0 ? (questionsAttempted / totalQuestions) * 100 : 0;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        Attempts Analysis
      </h2>
      <div className="flex justify-center items-center">
        <div className="relative">
          <svg className="w-32 h-32" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              stroke="#E5E7EB"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              stroke="#3B82F6"
              strokeWidth="2"
              fill="none"
              strokeDasharray="100"
              strokeDashoffset={100 - attemptPercentage}
            />
          </svg>
          <p className="absolute inset-0 flex justify-center items-center text-lg font-semibold text-gray-700">
            {attemptPercentage.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default AttemptsAnalysis;
