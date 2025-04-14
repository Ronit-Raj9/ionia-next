import React from 'react';
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

interface TimeAnalysisProps {
  data: any;
}

const TimeAnalysis: React.FC<TimeAnalysisProps> = ({ data }) => {
  // Ensure we have timeAnalytics data
  const timeAnalytics = data?.timeAnalytics || {
    totalTimeSpent: 0,
    averageTimePerQuestion: 0,
    questionTimeDistribution: {}
  };

  console.log("TimeAnalysis received data:", { 
    hasTimeAnalytics: !!data?.timeAnalytics,
    totalTimeSpent: timeAnalytics.totalTimeSpent,
    averageTimePerQuestion: timeAnalytics.averageTimePerQuestion,
    performance: data?.performance
  });

  // Log the raw totalTimeTaken from performance if available
  if (data?.performance?.totalTimeTaken) {
    debugTimeValue('Performance.totalTimeTaken', data.performance.totalTimeTaken);
  }

  // Handle missing time data
  let totalTimeSpent = timeAnalytics.totalTimeSpent || 
                     data?.performance?.totalTimeTaken || 0;
  
  // Always ensure we're working with seconds
  if (totalTimeSpent > 100) {
    console.log("⏱️ Converting totalTimeSpent from ms to seconds:", totalTimeSpent);
    totalTimeSpent = totalTimeSpent / 1000;
  }
  
  let averageTimePerQuestion = timeAnalytics.averageTimePerQuestion || 
                            (data?.performance?.totalQuestions && totalTimeSpent ? 
                            totalTimeSpent / data.performance.totalQuestions : 0);
  
  // Always ensure average time is in seconds too
  if (averageTimePerQuestion > 100) {
    console.log("⏱️ Converting averageTimePerQuestion from ms to seconds:", averageTimePerQuestion);
    averageTimePerQuestion = averageTimePerQuestion / 1000;
  }

  // Log the values that will be displayed
  debugTimeValue('Total Time Spent (display value)', totalTimeSpent);
  debugTimeValue('Average Time per Question (display value)', averageTimePerQuestion);

  // Create time distribution data
  const timeDistributionData = [
    {
      name: '< 30s',
      questions: timeAnalytics?.questionTimeDistribution?.lessThan30Sec?.length || 0,
    },
    {
      name: '30s - 1m',
      questions: timeAnalytics?.questionTimeDistribution?.between30To60Sec?.length || 0,
    },
    {
      name: '1m - 2m',
      questions: timeAnalytics?.questionTimeDistribution?.between1To2Min?.length || 0,
    },
    {
      name: '> 2m',
      questions: timeAnalytics?.questionTimeDistribution?.moreThan2Min?.length || 0,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Debug panel - hidden from users but still logging to console */}
      <div className="bg-yellow-50 p-4 rounded-lg text-xs overflow-auto hidden">
        <h4 className="font-bold">Time Data Debug:</h4>
        <pre>{JSON.stringify({
          rawValues: {
            totalTimeSpent: totalTimeSpent,
            averageTimePerQuestion: averageTimePerQuestion,
            performanceTotalTimeTaken: data?.performance?.totalTimeTaken
          },
          convertedValues: {
            totalTimeSpentInSeconds: totalTimeSpent > 100 ? totalTimeSpent / 1000 : totalTimeSpent,
            averageTimeInSeconds: averageTimePerQuestion > 100 ? averageTimePerQuestion / 1000 : averageTimePerQuestion
          },
          formattedValues: {
            totalTimeSpent: formatDuration(totalTimeSpent),
            averageTimePerQuestion: formatDuration(averageTimePerQuestion)
          }
        }, null, 2)}</pre>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Time Spent Distribution</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="questions" fill="#3B82F6" name="Number of Questions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Overall Time Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total Time Spent</div>
            <div className="text-2xl font-semibold">{formatDuration(totalTimeSpent)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Average Time per Question</div>
            <div className="text-2xl font-semibold">
              {formatDuration(averageTimePerQuestion)}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Questions Answered</div>
            <div className="text-2xl font-semibold">
              {data.performance?.totalQuestions || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDuration = (time: number) => {
  // Log the incoming time value
  console.log("⏱️ TimeAnalysis raw time value:", time);
  
  // If time is missing or invalid, return a default
  if (!time || isNaN(time) || time < 0) {
    console.log("⏱️ Invalid time value, using default of 0s");
    return "0m 0s";
  }
  
  // IMPORTANT FIX: Always convert from milliseconds to seconds if the value is more than 100
  // This ensures we handle API inconsistencies correctly
  const timeInSeconds = time > 100 ? time / 1000 : time;
  console.log("⏱️ TimeAnalysis converted to seconds:", timeInSeconds);
  
  // Process the time in seconds format
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  console.log(`⏱️ Formatted time: ${timeInSeconds}s -> ${minutes}m ${seconds}s`);
  
  return `${minutes}m ${seconds}s`;
};

// Add a simple utility to help debug the application
const debugTimeValue = (label: string, value: number) => {
  console.log(`⏱️ DEBUG ${label}:`, {
    rawValue: value,
    convertedToSeconds: value > 100 ? value / 1000 : value,
    formattedTime: formatDuration(value)
  });
};

export default TimeAnalysis; 