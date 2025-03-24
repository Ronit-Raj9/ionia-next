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

interface SectionCompletionData {
  completionRate: number;
  timeUtilization: number;
  efficiency: number;
}

interface StrategyMetrics {
  sectionCompletion: Record<string, SectionCompletionData>;
  timeManagement: {
    averageTimePerQuestion: number;
    timeDistribution: {
      quick: number;
      moderate: number;
      lengthy: number;
    };
  };
  questionSelection: {
    difficultyOrder: string[];
    topicCoverage: Record<string, number>;
  };
}

interface StrategyAnalysisProps {
  completionMetrics: StrategyMetrics;
}

const StrategyAnalysis: React.FC<StrategyAnalysisProps> = ({ completionMetrics }) => {
  // Prepare data for section completion chart
  const sectionCompletionData = Object.entries(completionMetrics.sectionCompletion).map(([section, data]) => ({
    name: section,
    completionRate: Math.round(data.completionRate * 100),
    timeUtilization: Math.round(data.timeUtilization * 100),
    efficiency: Math.round(data.efficiency * 100),
  }));

  // Prepare data for time distribution chart
  const timeDistributionData = [
    {
      name: 'Quick',
      value: Math.round(completionMetrics.timeManagement.timeDistribution.quick * 100),
    },
    {
      name: 'Moderate',
      value: Math.round(completionMetrics.timeManagement.timeDistribution.moderate * 100),
    },
    {
      name: 'Lengthy',
      value: Math.round(completionMetrics.timeManagement.timeDistribution.lengthy * 100),
    },
  ];

  // Prepare data for topic coverage radar chart
  const topicCoverageData = Object.entries(completionMetrics.questionSelection.topicCoverage).map(([topic, coverage]) => ({
    topic,
    coverage: Math.round(coverage * 100),
  }));

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Section Completion Analysis</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectionCompletionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completionRate" name="Completion Rate" fill="#10B981" />
              <Bar dataKey="timeUtilization" name="Time Utilization" fill="#3B82F6" />
              <Bar dataKey="efficiency" name="Efficiency" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4">Time Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Percentage of Questions" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-4">Topic Coverage</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={90} data={topicCoverageData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="topic" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Coverage" dataKey="coverage" stroke="#EC4899" fill="#EC4899" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Question Selection Strategy</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Difficulty Progression</h3>
            <div className="flex flex-wrap gap-2">
              {completionMetrics.questionSelection.difficultyOrder.map((difficulty, index) => (
                <div
                  key={difficulty}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {index + 1}. {difficulty}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Time Management</h3>
            <p className="text-gray-600">
              Average time per question: {Math.round(completionMetrics.timeManagement.averageTimePerQuestion)} seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalysis; 