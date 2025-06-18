import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';

interface RevisitPattern {
  questionId: string;
  visitCount?: number;
  finalOutcome?: string;
}

interface NavigationHistory {
  timestamp?: number;
  action?: string;
  fromQuestion?: string;
  toQuestion?: string;
}

interface ConfidenceMetrics {
  quickAnswers: string[];
  longDeliberations: string[];
  multipleRevisions: string[];
}

interface BehavioralAnalytics {
  revisitPatterns: RevisitPattern[];
  sectionTransitions: any[];
  confidenceMetrics: ConfidenceMetrics;
}

interface BehavioralAnalysisProps {
  data: any;
}

const BehavioralAnalysis: React.FC<BehavioralAnalysisProps> = ({ data }) => {
  const { behavioralAnalytics, navigationHistory, metadata } = data || {};
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  // Ensure we have data with safe fallbacks
  const revisitPatterns: RevisitPattern[] = behavioralAnalytics?.revisitPatterns || [];
  const sectionTransitions = behavioralAnalytics?.sectionTransitions || [];
  const confidenceMetrics: ConfidenceMetrics = behavioralAnalytics?.confidenceMetrics || {
    quickAnswers: [],
    longDeliberations: [],
    multipleRevisions: []
  };
  const navHistory: NavigationHistory[] = navigationHistory || [];
  const questions = metadata?.questions || [];

  // Calculate visit frequency
  const visitFrequency = revisitPatterns.map((pattern: RevisitPattern) => ({
    questionId: pattern.questionId,
    visits: pattern.visitCount || 1,
    outcome: pattern.finalOutcome || 'unattempted',
    color: pattern.finalOutcome === 'correct' ? '#10B981' : 
           pattern.finalOutcome === 'incorrect' ? '#EF4444' : '#94A3B8',
  }));

  // Format navigation data for timeline
  const navigationData = navHistory.map((nav, index) => ({
    time: formatTime(nav.timestamp || Date.now()),
    action: nav.action || 'view',
    from: nav.fromQuestion ? `Q${nav.fromQuestion.slice(-3)}` : '',
    to: nav.toQuestion ? `Q${nav.toQuestion.slice(-3)}` : '',
    index,
  }));

  // Filter navigation data for selected question
  const questionNavigationData = selectedQuestion 
    ? navHistory
        .filter(nav => nav.fromQuestion === selectedQuestion || nav.toQuestion === selectedQuestion)
        .map((nav, index) => ({
          time: formatTime(nav.timestamp || Date.now()),
          action: nav.action || 'view',
          from: nav.fromQuestion ? `Q${nav.fromQuestion.slice(-3)}` : '',
          to: nav.toQuestion ? `Q${nav.toQuestion.slice(-3)}` : '',
          index,
        }))
    : [];

  // Prepare confidence data
  const confidenceData = [
    { name: 'Quick Answers', value: confidenceMetrics.quickAnswers.length, color: '#10B981' },
    { name: 'Long Deliberations', value: confidenceMetrics.longDeliberations.length, color: '#F59E0B' },
    { name: 'Multiple Revisions', value: confidenceMetrics.multipleRevisions.length, color: '#8B5CF6' },
  ];

  // Handle the case when there's no data
  if (revisitPatterns.length === 0 && sectionTransitions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-16 h-16 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">No Behavioral Data Available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Behavioral analytics data is not available for this test attempt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Question Visit Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Revisit Frequency</h3>
            {visitFrequency.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="category" 
                      dataKey="questionId" 
                      name="Question" 
                      tick={false}
                      label={{ value: 'Questions', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      dataKey="visits" 
                      name="Visits" 
                      label={{ value: 'Number of Visits', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis range={[100, 100]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name, props) => [
                        `Visits: ${value}`,
                        `Question: ${props.payload.questionId.slice(-3)}`
                      ]}
                    />
                    <Legend />
                    <Scatter 
                      name="Question Visits" 
                      data={visitFrequency} 
                      fill="#8884d8" 
                      onClick={(data) => setSelectedQuestion(data.questionId)}
                      cursor="pointer"
                    >
                      {visitFrequency.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">No visit data available</p>
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500 text-center">
              Click on a point to see question details
            </div>
          </div>
          <div>
            {selectedQuestion ? (
              <div>
                <h3 className="text-lg font-medium mb-3">
                  Question {selectedQuestion.slice(-3)} Activity
                </h3>
                {questionNavigationData.length > 0 ? (
                  <div className="overflow-auto h-64 border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-xs text-gray-500">Time</th>
                          <th className="px-4 py-2 text-xs text-gray-500">Action</th>
                          <th className="px-4 py-2 text-xs text-gray-500">From</th>
                          <th className="px-4 py-2 text-xs text-gray-500">To</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {questionNavigationData.map((nav, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-xs text-gray-500">{nav.time}</td>
                            <td className="px-4 py-2 text-xs text-gray-500 capitalize">{nav.action}</td>
                            <td className="px-4 py-2 text-xs text-gray-500">{nav.from}</td>
                            <td className="px-4 py-2 text-xs text-gray-500">{nav.to}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No activity data available for this question</p>
                  </div>
                )}
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="mt-4 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Select a question to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Confidence Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Confidence Distribution</h3>
            {confidenceData.some(item => item.value > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={confidenceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} questions`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">No confidence metrics available</p>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Confidence Analysis</h3>
            <div className="space-y-4">
              <div className="border p-3 rounded-md bg-green-50">
                <h4 className="font-medium text-green-800">Quick Answers (High Confidence)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {confidenceMetrics.quickAnswers.length} questions answered quickly with confidence
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  {confidenceMetrics.quickAnswers.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {confidenceMetrics.quickAnswers.slice(0, 5).map((q: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-green-100 rounded">Q{q.slice(-3)}</span>
                      ))}
                      {confidenceMetrics.quickAnswers.length > 5 && (
                        <span className="px-2 py-1 bg-green-100 rounded">
                          +{confidenceMetrics.quickAnswers.length - 5} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">No questions in this category</p>
                  )}
                </div>
              </div>

              <div className="border p-3 rounded-md bg-amber-50">
                <h4 className="font-medium text-amber-800">Long Deliberations (Uncertain)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {confidenceMetrics.longDeliberations.length} questions took longer time to answer
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  {confidenceMetrics.longDeliberations.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {confidenceMetrics.longDeliberations.slice(0, 5).map((q: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-amber-100 rounded">Q{q.slice(-3)}</span>
                      ))}
                      {confidenceMetrics.longDeliberations.length > 5 && (
                        <span className="px-2 py-1 bg-amber-100 rounded">
                          +{confidenceMetrics.longDeliberations.length - 5} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">No questions in this category</p>
                  )}
                </div>
              </div>

              <div className="border p-3 rounded-md bg-purple-50">
                <h4 className="font-medium text-purple-800">Multiple Revisions (Changed Mind)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {confidenceMetrics.multipleRevisions.length} questions where you changed your answer
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  {confidenceMetrics.multipleRevisions.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {confidenceMetrics.multipleRevisions.slice(0, 5).map((q: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-purple-100 rounded">Q{q.slice(-3)}</span>
                      ))}
                      {confidenceMetrics.multipleRevisions.length > 5 && (
                        <span className="px-2 py-1 bg-purple-100 rounded">
                          +{confidenceMetrics.multipleRevisions.length - 5} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">No questions in this category</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Format time from timestamp
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default BehavioralAnalysis; 