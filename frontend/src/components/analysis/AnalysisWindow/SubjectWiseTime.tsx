"use client";

import React from "react";
import { useAnalysis } from "@/context/AnalysisContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const SubjectWiseTime: React.FC = () => {
  const { analysisData } = useAnalysis();

  if (!analysisData) {
    return <div className="bg-gray-50 p-6 rounded-lg shadow text-center text-gray-500">No analysis data available.</div>;
  }

  // Calculate total questions and time spent
  const totalQuestions = Object.values(analysisData.subjectWise).reduce(
    (sum, subject) => sum + subject.total,
    0
  );

  const totalTimeSpent = Object.values(analysisData.subjectWise).reduce(
    (sum, subject) => sum + subject.timeSpent,
    0
  );

  // Prepare data for the bar chart
  const chartData = Object.entries(analysisData.subjectWise).map(([subject, data]) => ({
    subject,
    timeSpent: Math.round(data.timeSpent / 1000), // Convert to seconds
    questionsAttempted: data.attempted,
    averageTime: Math.round(data.timeSpent / data.attempted / 1000), // Average time per question in seconds
  }));

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Subject-wise Time Analysis</h2>
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis yAxisId="left" label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Questions', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="timeSpent" name="Total Time" fill="#3B82F6" />
            <Bar yAxisId="right" dataKey="questionsAttempted" name="Questions Attempted" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Questions</h3>
          <p className="text-2xl font-semibold text-gray-900">{totalQuestions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Time Spent</h3>
          <p className="text-2xl font-semibold text-gray-900">{Math.round(totalTimeSpent / 1000)} seconds</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Time per Question</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {Math.round(totalTimeSpent / totalQuestions / 1000)} seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubjectWiseTime;
