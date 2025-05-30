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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface SectionData {
  name: string;
  order: number;
  completion: number;
  accuracy: number;
  timeSpent: number;
}

interface StrategyMetrics {
  sectionCompletion: SectionData[];
  timeManagement: {
    averageTimePerQuestion: number;
    timeEfficiency: number;
    timeDistribution?: {
      quick: number;
      moderate: number;
      lengthy: number;
    };
  };
  questionSelection?: {
    difficultyOrder: string[];
    topicCoverage: Record<string, number>;
  };
}

interface StrategyAnalysisProps {
  completionMetrics: StrategyMetrics;
}

const StrategyAnalysis: React.FC<StrategyAnalysisProps> = ({ completionMetrics }) => {
  const formatTime = (timeInSeconds: number): string => {
    if (timeInSeconds === undefined || timeInSeconds === null || isNaN(timeInSeconds)) {
      return '0 sec';
    }

    // Round the time to the nearest second
    const seconds = Math.round(timeInSeconds);
    
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} min`;
    }
    
    return `${minutes} min ${remainingSeconds} sec`;
  };

  // Time management stats
  const timeManagement = completionMetrics.timeManagement || {
    averageTimePerQuestion: 0,
    timeEfficiency: 0
  };

  // Parse completion data
  const completionData = completionMetrics.sectionCompletion || [];
  
  // Sort sections by order
  const sortedSections = [...completionData].sort((a, b) => a.order - b.order);

  // Calculate the average accuracy across all sections
  const averageAccuracy = sortedSections.length > 0
    ? sortedSections.reduce((sum, section) => sum + (section.accuracy || 0), 0) / sortedSections.length
    : 0;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Strategy Analysis</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Average Time Per Question</h3>
          <p className="text-3xl font-bold">{formatTime(timeManagement.averageTimePerQuestion)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Time Efficiency</h3>
          <p className="text-3xl font-bold">{Math.round(timeManagement.timeEfficiency * 100)}%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Overall Accuracy</h3>
          <p className="text-3xl font-bold">{Math.round(averageAccuracy * 100)}%</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Section Completion Strategy</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSections.map((section, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{section.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{section.order}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Math.round((section.completion || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Math.round((section.accuracy || 0) * 100)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatTime(section.timeSpent || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
        
        <div className="space-y-4">
          {timeManagement.averageTimePerQuestion > 90 && (
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
              <p className="text-yellow-700">
                Your average time per question is high. Consider practicing more to improve your speed.
              </p>
            </div>
          )}
          
          {timeManagement.timeEfficiency < 0.7 && (
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
              <p className="text-yellow-700">
                Your time efficiency could be improved. Focus on managing your time better across sections.
              </p>
            </div>
          )}
          
          {averageAccuracy < 0.6 && (
            <div className="p-4 border-l-4 border-red-500 bg-red-50">
              <p className="text-red-700">
                Your accuracy is below optimal levels. Consider spending more time understanding the concepts.
              </p>
            </div>
          )}
          
          {sortedSections.length > 0 && sortedSections.every((section, idx) => section.order === idx + 1) && (
            <div className="p-4 border-l-4 border-green-500 bg-green-50">
              <p className="text-green-700">
                You completed sections in the intended order, which is a good strategy.
              </p>
            </div>
          )}
          
          {averageAccuracy > 0.8 && timeManagement.timeEfficiency > 0.8 && (
            <div className="p-4 border-l-4 border-green-500 bg-green-50">
              <p className="text-green-700">
                Excellent work! You have good accuracy and time management skills.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalysis; 