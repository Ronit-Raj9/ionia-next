"use client";
import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SubjectAnalysisProps {
  id: string;
  subjectWise: Record<string, any>;
}

const SubjectAnalysis: React.FC<SubjectAnalysisProps> = ({ id, subjectWise }) => {
  // Add additional debug output for the specific subject we're viewing
  console.log("📊 SubjectAnalysis props:", { id, subjectWiseKeys: Object.keys(subjectWise) });
  
  if (id in subjectWise) {
    console.log(`📊 Subject data for ${id}:`, subjectWise[id]);
    if (subjectWise[id].timeSpent) {
      console.log(`⏱️ Raw timeSpent for ${id}:`, subjectWise[id].timeSpent);
    }
  }

  const formatTime = (timeInMilliseconds: number): string => {
    if (timeInMilliseconds === undefined || timeInMilliseconds === null || isNaN(timeInMilliseconds) || timeInMilliseconds < 0) {
      console.log("⏱️ SubjectAnalysis: Invalid time value, using default of 0s");
      return '0 sec';
    }

    console.log("⏱️ SubjectAnalysis raw time value:", timeInMilliseconds);
    
    // FIXED CONVERSION: Always ensure we're working with seconds
    // For any value > 100, assume it's in milliseconds and convert to seconds
    const timeInSeconds = timeInMilliseconds > 100 ? timeInMilliseconds / 1000 : timeInMilliseconds;
    
    console.log("⏱️ SubjectAnalysis converted to seconds:", timeInSeconds);
    
    // Round the time to the nearest second
    const seconds = Math.round(timeInSeconds);
    
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    console.log(`⏱️ Formatted time: ${timeInSeconds}s -> ${minutes}m ${remainingSeconds}s`);
    
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    
    return `${minutes} min ${remainingSeconds} sec`;
  };
  
  // Check if we're showing a specific subject
  const isSubjectView = id !== 'Overall';
  
  // Get the data for the current subject
  const subjectData = isSubjectView ? subjectWise[id] : null;
  
  // Create chart data from all subjects
  const chartData = Object.keys(subjectWise).map((subject) => {
    const data = subjectWise[subject];
    return {
      name: subject,
      total: data.total || 0,
      attempted: data.attempted || 0,
      correct: data.correct || 0,
      timeSpent: data.timeSpent || 0,
    };
  });
  
  // Find the maximum value for the chart scale
  const maxDataValue = Math.max(
    ...chartData.map((item) => Math.max(item.total, item.attempted, item.correct))
  );
  
  return (
    <div className="subject-analysis">
      <h2 className="text-2xl font-bold mb-6">Subject Analysis</h2>
      
      {/* Add debug info to help diagnose - hidden from the user but still logging to console */}
      <div className="mb-4 p-4 bg-yellow-50 rounded-lg text-xs overflow-auto hidden">
        <h4 className="font-bold">Time Values Debug:</h4>
        <pre>{JSON.stringify({
          subject: id,
          subjectData: subjectWise[id] || {},
          timeValues: Object.entries(subjectWise).reduce((acc: Record<string, { raw: number; converted: number; formatted: string }>, [subject, data]) => {
            acc[subject] = {
              raw: data.timeSpent || 0,
              converted: data.timeSpent > 100 ? data.timeSpent / 1000 : data.timeSpent,
              formatted: formatTime(data.timeSpent || 0)
            };
            return acc;
          }, {})
        }, null, 2)}</pre>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Subject-wise Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, Math.ceil(maxDataValue * 1.1)]} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'timeSpent') return formatTime(Number(value));
                  return value;
                }}
              />
              <Legend />
              <Bar dataKey="total" fill="#8884d8" name="Total Questions" />
              <Bar dataKey="attempted" fill="#82ca9d" name="Attempted" />
              <Bar dataKey="correct" fill="#ffc658" name="Correct" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Object.keys(subjectWise).map((subject) => {
          const data = subjectWise[subject];
          const accuracy = data.attempted > 0 ? (data.correct / data.attempted) * 100 : 0;
          const completion = data.total > 0 ? (data.attempted / data.total) * 100 : 0;
          
          // Log time values before calculating average
          console.log(`⏱️ Subject ${subject} - timeSpent: ${data.timeSpent}, attempted: ${data.attempted}`);
          
          // CRITICAL FIX: Ensure we're working with seconds
          const timeSpentInSeconds = data.timeSpent > 100 ? data.timeSpent / 1000 : data.timeSpent;
          const averageTime = data.attempted > 0 && data.timeSpent 
            ? timeSpentInSeconds / data.attempted 
            : 0;
          
          console.log(`⏱️ Subject ${subject} - calculated averageTime: ${averageTime}`);

          return (
            <div key={subject} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">{subject}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Accuracy</p>
                  <p className="text-2xl font-bold">
                    {accuracy.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Completion</p>
                  <p className="text-2xl font-bold">
                    {completion.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Time</p>
                  <p className="text-2xl font-bold">
                    {formatTime(averageTime)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Time</p>
                  <p className="text-2xl font-bold">
                    {formatTime(timeSpentInSeconds)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectAnalysis; 