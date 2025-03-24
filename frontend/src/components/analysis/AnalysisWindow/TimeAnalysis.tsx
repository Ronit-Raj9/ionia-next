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
  const { timeAnalytics } = data;

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
            <div className="text-2xl font-semibold">{formatDuration(timeAnalytics?.totalTimeSpent || 0)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Average Time per Question</div>
            <div className="text-2xl font-semibold">
              {formatDuration(timeAnalytics?.averageTimePerQuestion || 0)}
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

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

export default TimeAnalysis; 