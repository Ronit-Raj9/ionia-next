"use client";

import React from "react";
import { useAnalysisStore } from "@/features/analysis/store/analysisStore";
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
  const { currentAnalysis } = useAnalysisStore();

  if (!currentAnalysis) {
    return <div className="bg-gray-50 p-6 rounded-lg shadow text-center text-gray-500">No analysis data available.</div>;
  }

  // Calculate total questions and time spent from subject performance data
  const totalQuestions = currentAnalysis.subjectPerformance?.reduce(
    (sum, subject) => sum + subject.totalQuestions,
    0
  ) || 0;

  const totalTimeSpent = currentAnalysis.timeAnalysis?.totalTime || 0;

  console.log("SubjectWiseTime data:", {
    totalTimeSpent,
    subjectPerformance: currentAnalysis.subjectPerformance
  });

  // Function to normalize time values - properly handle milliseconds
  const normalizeTimeValue = (timeValue: any) => {
    if (!timeValue || typeof timeValue !== 'number' || timeValue < 0) return 0;
    
    // If the value is large (likely milliseconds), convert to seconds
    const timeInSeconds = timeValue > 1000 ? timeValue / 1000 : timeValue;
    
    console.log(`⏱️ SubjectWiseTime normalized value: ${timeValue} -> ${timeInSeconds}s`);
    return timeInSeconds;
  };

  // Function to format time in a readable way - assuming input is seconds
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || seconds < 0) {
      console.log("⏱️ Invalid time value, using default of 0s");
      return "0 sec";
    }
    
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    
    if (min === 0) return `${sec} sec`;
    return `${min} min ${sec} sec`;
  };

  // Prepare data for the bar chart from subject performance data
  const chartData = currentAnalysis.subjectPerformance?.map((subject) => {
    const timeInSeconds = normalizeTimeValue(subject.averageTime * subject.totalQuestions);
    const averageTime = subject.totalQuestions ? timeInSeconds / subject.totalQuestions : 0;
    
    return {
      subject: subject.subject,
      timeSpent: Math.round(timeInSeconds),
      questionsAttempted: subject.totalQuestions,
      averageTime: Math.round(averageTime),
    };
  }) || [];

  // Calculate normalized total time
  const normalizedTotalTime = normalizeTimeValue(totalTimeSpent);

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      {/* Debug panel - hidden by default */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg text-xs overflow-auto hidden">
        <pre>{JSON.stringify({chartData, normalizedTotalTime}, null, 2)}</pre>
      </div>
      
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Subject-wise Time Analysis</h2>
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="subject" />
            <YAxis yAxisId="left" label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Questions', angle: 90, position: 'insideRight' }} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'timeSpent') return formatTime(Number(value));
                if (name === 'averageTime') return formatTime(Number(value));
                return value;
              }}
            />
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
          <p className="text-2xl font-semibold text-gray-900">{formatTime(normalizedTotalTime)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Time per Question</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {formatTime(totalQuestions ? normalizedTotalTime / totalQuestions : 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubjectWiseTime;
