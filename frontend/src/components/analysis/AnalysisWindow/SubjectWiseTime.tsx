"use client";

import React from "react";
import { useAnalysis } from "@/context/AnalysisContext";

const SubjectWiseTime: React.FC = () => {
  const { analysisData } = useAnalysis();

  if (!analysisData) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow text-center text-gray-500">
        No analysis data available.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        Subject-Wise Time Spent
      </h2>
      {/* Replace the following with your actual bar chart component */}
      <p>Insert Bar Chart Here using analysis data.</p>
      {/* For example, you might display a summary: */}
      <p>Total Questions: {analysisData.totalQuestions}</p>
      <p>Questions Attempted: {analysisData.questionsAttempted}</p>
      <p>Time Spent: {analysisData.timeSpent}</p>
    </div>
  );
};

export default SubjectWiseTime;
