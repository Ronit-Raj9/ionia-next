"use client";
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SubjectMetrics {
  total: number;
  attempted: number;
  correct: number;
  timeSpent: number;
}

interface SubjectAnalysisProps {
  id: string;
  subjectWise: Record<string, SubjectMetrics>;
}

const SubjectAnalysis: React.FC<SubjectAnalysisProps> = ({ id, subjectWise }) => {
  const subjectData = id === 'Overall' ? subjectWise : { [id]: subjectWise[id] };

  const data = {
    labels: Object.keys(subjectData),
    datasets: [
      {
        label: 'Total Questions',
        data: Object.values(subjectData).map(subject => subject.total),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
      {
        label: 'Attempted',
        data: Object.values(subjectData).map(subject => subject.attempted),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
      {
        label: 'Correct',
        data: Object.values(subjectData).map(subject => subject.correct),
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Subject-wise Performance',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4">Subject Analysis</h3>
      <div className="h-80">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(subjectData).map(([subject, metrics]) => (
          <div key={subject} className="p-4 border rounded-lg">
            <h4 className="font-medium text-lg mb-2">{subject}</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy</span>
                <span className="font-medium">
                  {metrics.attempted > 0
                    ? Math.round((metrics.correct / metrics.attempted) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completion</span>
                <span className="font-medium">
                  {Math.round((metrics.attempted / metrics.total) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Time</span>
                <span className="font-medium">
                  {Math.round(metrics.timeSpent / metrics.attempted / 1000)} sec
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectAnalysis; 