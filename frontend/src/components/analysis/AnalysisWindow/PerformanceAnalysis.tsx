import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from 'recharts';
import { AnalysisData } from '@/types/analysis';

interface PerformanceAnalysisProps {
  data: AnalysisData;
}

const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({ data }) => {
  const { progressionMetrics, historicalComparison, subjectWise } = data;
  const [selectedView, setSelectedView] = useState('accuracy');

  // Prepare accuracy trend data
  const accuracyTrendData = progressionMetrics?.accuracyTrend?.map((point, index) => ({
    question: `Q${index + 1}`,
    accuracy: Math.round(point.cumulativeAccuracy * 100),
    timeSpent: Math.round(point.timeSpent / 1000),
    isCorrect: point.isCorrect,
  })) || [];

  // Prepare speed trend data
  const speedTrendData = progressionMetrics?.speedTrend?.map((segment) => ({
    segment: `Segment ${segment.segment}`,
    averageTime: Math.round(segment.averageTimePerQuestion / 1000),
    questionsAttempted: segment.questionsAttempted,
  })) || [];

  // Prepare subject progression data
  const subjectProgressionData = Object.entries(progressionMetrics?.subjectProgression || {}).map(([subject, data]) => ({
    subject,
    firstHalf: Math.round(data.firstHalfAccuracy * 100),
    secondHalf: Math.round(data.secondHalfAccuracy * 100),
    improvement: Math.round((data.secondHalfAccuracy - data.firstHalfAccuracy) * 100),
  }));

  // Prepare subject metrics for radar chart
  const subjectRadarData = Object.entries(subjectWise || {}).map(([subject, data]) => ({
    subject,
    accuracy: Math.round((data.correct / data.attempted) * 100) || 0,
    completeness: Math.round((data.attempted / data.total) * 100),
    timeEfficiency: 100 - Math.min(100, Math.round((data.timeSpent / (data.total * 60000)) * 100)),
  }));

  // Historical trends (if available)
  const historicalData = historicalComparison?.previousAttempts || [];
  const historicalTrendData = historicalData.map((attempt) => ({
    attempt: `Attempt ${attempt.attemptId}`,
    score: attempt.score,
    timeSpent: Math.round(attempt.timeSpent / 60000),
  }));

  // Performance metrics
  const performanceScores = [
    { name: 'Accuracy', score: calculateOverallAccuracy(), color: '#10B981' },
    { name: 'Speed', score: calculateSpeedScore(), color: '#3B82F6' },
    { name: 'Subject Balance', score: calculateSubjectBalanceScore(), color: '#8B5CF6' },
    { name: 'Time Efficiency', score: calculateTimeEfficiencyScore(), color: '#F59E0B' },
    { name: 'Improvement', score: calculateImprovementScore(), color: '#EC4899' },
  ];

  function calculateOverallAccuracy() {
    const correctCount = Object.values(subjectWise || {}).reduce((sum: number, subject) => sum + subject.correct, 0);
    const attemptedCount = Object.values(subjectWise || {}).reduce((sum: number, subject) => sum + subject.attempted, 0);
    return attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
  }

  function calculateSpeedScore() {
    // Placeholder calculation - customize based on your scoring model
    return 75;
  }

  function calculateSubjectBalanceScore() {
    // Check if there's balanced performance across subjects
    const accuracies = Object.values(subjectWise || {}).map((subject) => 
      subject.attempted > 0 ? (subject.correct / subject.attempted) * 100 : 0
    );
    
    if (accuracies.length <= 1) return 100;
    
    // Calculate the standard deviation as a measure of balance
    const mean = accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length;
    const variance = accuracies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / accuracies.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to a 0-100 score (lower stdDev means better balance)
    return Math.max(0, Math.min(100, 100 - Math.round(stdDev)));
  }

  function calculateTimeEfficiencyScore() {
    // Placeholder calculation - customize based on your scoring model
    return 82;
  }

  function calculateImprovementScore() {
    if (!historicalComparison?.previousAttempts?.length) return 0;
    
    // Placeholder calculation - customize based on your scoring model
    return 65;
  }

  function findTopSubjects() {
    const subjects = Object.entries(subjectWise || {})
      .filter(([_, data]) => data.attempted > 0)
      .map(([subject, data]) => ({
        subject,
        accuracy: (data.correct / data.attempted) * 100
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .map(item => item.subject);
    
    return subjects.length > 0 ? subjects : ['Mathematics', 'Sciences'];
  }

  function findWeakestSubjects() {
    const subjects = Object.entries(subjectWise || {})
      .filter(([_, data]) => data.attempted > 0)
      .map(([subject, data]) => ({
        subject,
        accuracy: (data.correct / data.attempted) * 100
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .map(item => item.subject);
    
    return subjects.length > 0 ? subjects : ['Verbal Reasoning', 'Critical Reading'];
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Performance Progress</h2>
        <div className="mb-4">
          <div className="flex space-x-2 mb-4">
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedView === 'accuracy' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedView('accuracy')}
            >
              Accuracy Progression
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedView === 'speed' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedView('speed')}
            >
              Speed Analysis
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                selectedView === 'subjects' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedView('subjects')}
            >
              Subject Progression
            </button>
            {historicalData.length > 0 && (
              <button
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  selectedView === 'historical' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedView('historical')}
              >
                Historical Comparison
              </button>
            )}
          </div>
          
          <div className="h-80">
            {selectedView === 'accuracy' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={accuracyTrendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" />
                  <YAxis label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'accuracy' ? `${value}%` : `${value}s`,
                      name === 'accuracy' ? 'Cumulative Accuracy' : 'Time Spent'
                    ]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="accuracy" stroke="#10B981" fill="#DCFCE7" activeDot={{ r: 8 }} name="Cumulative Accuracy" />
                  <Area type="monotone" dataKey="timeSpent" stroke="#F59E0B" fill="#FEF3C7" name="Time Spent (s)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
            
            {selectedView === 'speed' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={speedTrendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis yAxisId="left" label={{ value: 'Avg Time (s)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Questions', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="averageTime" fill="#3B82F6" name="Average Time (s)" />
                  <Bar yAxisId="right" dataKey="questionsAttempted" fill="#8B5CF6" name="Questions Attempted" />
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {selectedView === 'subjects' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={subjectProgressionData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="firstHalf" fill="#3B82F6" name="First Half Accuracy" />
                  <Bar dataKey="secondHalf" fill="#10B981" name="Second Half Accuracy" />
                  <Bar dataKey="improvement" fill="#EC4899" name="Improvement" />
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {selectedView === 'historical' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historicalTrendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="attempt" />
                  <YAxis yAxisId="left" label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Time (min)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="score" stroke="#10B981" activeDot={{ r: 8 }} name="Score" />
                  <Line yAxisId="right" type="monotone" dataKey="timeSpent" stroke="#F59E0B" name="Time Spent (min)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Subject Performance Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Subject Balance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={subjectRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Accuracy" dataKey="accuracy" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
                  <Radar name="Completeness" dataKey="completeness" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.5} />
                  <Radar name="Time Efficiency" dataKey="timeEfficiency" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.5} />
                  <Legend />
                  <Tooltip formatter={(value) => [`${value}%`]} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Performance Metrics</h3>
            <div className="space-y-4">
              {performanceScores.map((metric) => (
                <div key={metric.name} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <span className="text-sm font-medium">{metric.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{ 
                        width: `${metric.score}%`,
                        backgroundColor: metric.color
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-2">Overall Performance Score</h4>
              <div className="text-4xl font-bold text-center">
                {Math.round(performanceScores.reduce((sum, metric) => sum + metric.score, 0) / performanceScores.length)}
                <span className="text-xl font-normal text-gray-500">%</span>
              </div>
              <div className="mt-2 text-center text-sm text-gray-500">
                Based on accuracy, speed, and subject balance
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Performance Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4 bg-green-50 border-green-200">
            <h3 className="text-lg font-medium mb-2 text-green-800">Strengths</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm text-gray-700">
                Strong performance in {findTopSubjects()[0] || 'most subjects'}
              </li>
              <li className="text-sm text-gray-700">
                Good time management on {speedTrendData.length > 0 ? 'early segments' : 'most questions'}
              </li>
              <li className="text-sm text-gray-700">
                {calculateOverallAccuracy() > 70 ? 'High overall accuracy' : 'Consistent improvement throughout the test'}
              </li>
            </ul>
          </div>
          <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
            <h3 className="text-lg font-medium mb-2 text-amber-800">Areas to Improve</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm text-gray-700">
                Focus more on {findWeakestSubjects()[0] || 'challenging subjects'}
              </li>
              <li className="text-sm text-gray-700">
                {accuracyTrendData.length > 5 && accuracyTrendData[accuracyTrendData.length - 1].accuracy < 
                 accuracyTrendData[Math.floor(accuracyTrendData.length / 2)].accuracy
                  ? 'Maintain accuracy in later questions'
                  : 'Review questions more carefully'}
              </li>
              <li className="text-sm text-gray-700">
                {calculateTimeEfficiencyScore() < 70 ? 'Improve time allocation across questions' : 'Balance speed and accuracy better'}
              </li>
            </ul>
          </div>
          <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-medium mb-2 text-blue-800">Recommendations</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li className="text-sm text-gray-700">
                Practice more questions in {findWeakestSubjects()[0] || 'weaker areas'}
              </li>
              <li className="text-sm text-gray-700">
                Work on {calculateSpeedScore() < 70 ? 'increasing speed' : 'improving accuracy'} in future tests
              </li>
              <li className="text-sm text-gray-700">
                {historicalData.length > 0 
                  ? 'Continue with consistent practice pattern' 
                  : 'Take more practice tests to track improvement'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalysis; 