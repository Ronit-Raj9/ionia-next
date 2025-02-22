"use client";
import React from "react";
import { useAnalysis } from "@/context/AnalysisContext";

const Summary: React.FC = () => {
  const { analysisData } = useAnalysis();

  if (!analysisData) return <div>Loading...</div>;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-6">Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-100 text-center p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <p className="text-3xl font-extrabold text-blue-600">
            {analysisData.marksObtained}
          </p>
          <p className="text-sm font-medium text-gray-600 mt-2">
            Marks Obtained
          </p>
        </div>
        <div className="bg-gray-100 text-center p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <p className="text-3xl font-extrabold text-gray-800">
            {analysisData.questionsAttempted}
          </p>
          <p className="text-sm font-medium text-gray-600 mt-2">
            Qs Attempted
          </p>
        </div>
        <div className="bg-green-100 text-center p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <p className="text-3xl font-extrabold text-green-600">
            {analysisData.accuracy}%
          </p>
          <p className="text-sm font-medium text-gray-600 mt-2">
            Accuracy
          </p>
        </div>
        <div className="bg-orange-100 text-center p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <p className="text-3xl font-extrabold text-orange-600">
            {analysisData.timeSpent} min
          </p>
          <p className="text-sm font-medium text-gray-600 mt-2">
            Time Spent
          </p>
        </div>
      </div>
    </div>
  );
};

export default Summary;
