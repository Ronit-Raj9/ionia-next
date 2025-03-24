'use client';
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { FiTrendingUp } from 'react-icons/fi';

export interface PerformanceData {
  date: string;
  score: number;
  accuracy?: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      score: Number(item.score.toFixed(1)),
      accuracy: item.accuracy ? Number(item.accuracy.toFixed(1)) : undefined
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-emerald-50 border border-emerald-100 rounded-lg"
      >
        <div className="flex items-center justify-center text-emerald-600">
          <FiTrendingUp className="mr-2 h-5 w-5" />
          <p>No performance data available</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#374151"
            tick={{ fill: '#374151' }}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#374151"
            tick={{ fill: '#374151' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #D1FAE5',
              borderRadius: '0.375rem',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#059669"
            strokeWidth={2}
            name="Score (%)"
            dot={{ r: 4, fill: '#059669' }}
            activeDot={{ r: 6, fill: '#059669' }}
          />
          {data[0]?.accuracy !== undefined && (
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="#10B981"
              strokeWidth={2}
              name="Accuracy (%)"
              dot={{ r: 4, fill: '#10B981' }}
              activeDot={{ r: 6, fill: '#10B981' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default PerformanceChart;

/* // components/dashboard/PerformanceChart.tsx
import { FC } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

interface PerformanceChartProps {
  data: { labels: string[]; values: number[] };
}

const PerformanceChart: FC<PerformanceChartProps> = ({ data }) => {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Test Performance',
        data: data.values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Performance Over Time</h3>
      <Line data={chartData} />
    </div>
  );
};

export default PerformanceChart;
 */