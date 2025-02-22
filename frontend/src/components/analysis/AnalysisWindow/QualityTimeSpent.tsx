"use client";

import React from "react";
import { useAnalysis } from "@/context/AnalysisContext";

const QualityTimeSpent: React.FC = () => {
  const { analysisData } = useAnalysis();

  if (!analysisData) {
    return <div className="bg-gray-50 p-6 rounded-lg shadow text-center text-gray-500">No analysis data available.</div>;
  }

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Quality of Time Spent</h2>
      {/* Replace this with your actual chart component using analysisData */}
      <p>Time Spent: {analysisData.timeSpent} seconds</p>
    </div>
  );
};

export default QualityTimeSpent;
