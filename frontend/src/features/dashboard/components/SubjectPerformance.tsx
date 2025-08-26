"use client";
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FiBarChart2 } from 'react-icons/fi';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export interface SubjectData {
  subject: string;
  score: number;
  accuracy?: number;
}

interface SubjectPerformanceProps {
  data: SubjectData[];
}

const SubjectPerformance: React.FC<SubjectPerformanceProps> = ({ data }) => {
  const chartData = useMemo(() => {
    // Group by subject and calculate averages
    const subjectMap = data.reduce((acc, item) => {
      if (!acc[item.subject]) {
        acc[item.subject] = {
          scores: [],
          accuracies: []
        };
      }
      acc[item.subject].scores.push(item.score);
      if (item.accuracy) {
        acc[item.subject].accuracies.push(item.accuracy);
      }
      return acc;
    }, {} as Record<string, { scores: number[]; accuracies: number[] }>);

    // Calculate averages
    const subjects = Object.keys(subjectMap);
    const averageScores = subjects.map(subject => {
      const scores = subjectMap[subject].scores;
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    });
    const averageAccuracies = subjects.map(subject => {
      const accuracies = subjectMap[subject].accuracies;
      return accuracies.length ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : null;
    });

    return {
      labels: subjects,
      datasets: [
        {
          label: 'Average Score',
          data: averageScores,
          backgroundColor: 'rgba(5, 150, 105, 0.8)', // emerald-600
          borderColor: 'rgb(5, 150, 105)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Average Accuracy',
          data: averageAccuracies,
          backgroundColor: 'rgba(16, 185, 129, 0.6)', // emerald-500
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: '#E5E7EB',
        },
        ticks: {
          color: '#374151',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#374151',
        }
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#374151',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#374151',
        bodyColor: '#374151',
        borderColor: '#D1FAE5',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        displayColors: true,
      },
    },
  };

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-emerald-50 border border-emerald-100 rounded-lg"
      >
        <div className="flex items-center justify-center text-emerald-600">
          <FiBarChart2 className="mr-2 h-5 w-5" />
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
      <Bar options={options} data={chartData} />
    </motion.div>
  );
};

export default SubjectPerformance; 