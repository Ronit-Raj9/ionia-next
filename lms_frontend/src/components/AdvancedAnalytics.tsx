"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Calendar,
  Target,
  Award,
  Clock,
  BookOpen,
  Users,
  Brain,
  Eye,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AnalyticsData {
  studentId: string;
  timeRange: 'week' | 'month' | 'semester';
  performance: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
  };
  subjects: {
    name: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
    lastUpdated: string;
  }[];
  learningPatterns: {
    peakHours: string[];
    preferredSubjects: string[];
    difficultyLevel: 'easy' | 'medium' | 'hard';
    completionRate: number;
  };
  predictions: {
    nextWeekScore: number;
    riskAreas: string[];
    recommendations: string[];
  };
  parentReport: {
    overallProgress: number;
    strengths: string[];
    areasForImprovement: string[];
    engagement: number;
    attendance: number;
  };
}

interface AdvancedAnalyticsProps {
  studentId: string;
  isParentView?: boolean;
  onExportReport?: (data: any) => void;
}

export default function AdvancedAnalytics({ 
  studentId, 
  isParentView = false, 
  onExportReport 
}: AdvancedAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'semester'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'predictions' | 'parent'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [studentId, selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/advanced?studentId=${studentId}&timeRange=${selectedTimeRange}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        // Generate mock data for demo
        setAnalyticsData(generateMockData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): AnalyticsData => ({
    studentId,
    timeRange: selectedTimeRange,
    performance: {
      current: 85,
      previous: 78,
      trend: 'up'
    },
    subjects: [
      { name: 'Mathematics', score: 88, trend: 'up', lastUpdated: '2 days ago' },
      { name: 'Science', score: 82, trend: 'stable', lastUpdated: '1 day ago' },
      { name: 'English', score: 79, trend: 'down', lastUpdated: '3 days ago' },
      { name: 'History', score: 91, trend: 'up', lastUpdated: '1 day ago' }
    ],
    learningPatterns: {
      peakHours: ['9:00 AM', '2:00 PM', '7:00 PM'],
      preferredSubjects: ['Mathematics', 'History'],
      difficultyLevel: 'medium',
      completionRate: 87
    },
    predictions: {
      nextWeekScore: 87,
      riskAreas: ['English Grammar', 'Science Experiments'],
      recommendations: [
        'Focus on English writing practice',
        'Review science lab procedures',
        'Maintain current math performance'
      ]
    },
    parentReport: {
      overallProgress: 85,
      strengths: ['Mathematical reasoning', 'Historical analysis', 'Consistent effort'],
      areasForImprovement: ['English writing', 'Science practicals', 'Time management'],
      engagement: 92,
      attendance: 95
    }
  });

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const exportReport = () => {
    if (!analyticsData) return;
    
    const reportData = {
      studentId: analyticsData.studentId,
      timeRange: analyticsData.timeRange,
      generatedAt: new Date().toISOString(),
      performance: analyticsData.performance,
      subjects: analyticsData.subjects,
      learningPatterns: analyticsData.learningPatterns,
      predictions: analyticsData.predictions,
      parentReport: analyticsData.parentReport
    };

    // Create downloadable JSON file
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `student-analytics-${studentId}-${selectedTimeRange}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Analytics report exported successfully!');
    
    if (onExportReport) {
      onExportReport(reportData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">
            {isParentView ? 'Your child\'s learning insights' : 'Detailed performance analysis'}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'semester'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          <button
            onClick={exportReport}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'trends', label: 'Trends', icon: TrendingUp },
            { id: 'predictions', label: 'Predictions', icon: Brain },
            ...(isParentView ? [{ id: 'parent', label: 'Parent Report', icon: Users }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Performance Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Overall Performance</h3>
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {analyticsData.performance.current}%
                  </div>
                  <div className={`flex items-center justify-center space-x-2 ${
                    analyticsData.performance.trend === 'up' ? 'text-green-600' : 
                    analyticsData.performance.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {getTrendIcon(analyticsData.performance.trend)}
                    <span className="text-sm">
                      {analyticsData.performance.trend === 'up' ? '+' : ''}
                      {analyticsData.performance.current - analyticsData.performance.previous}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analyticsData.performance.current}%` }}
                    transition={{ duration: 1 }}
                    className="bg-emerald-500 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Subject Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subject Scores</h3>
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-3">
                {analyticsData.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                      <span className={`text-xs ${getTrendColor(subject.trend)}`}>
                        {getTrendIcon(subject.trend)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{subject.score}%</div>
                      <div className="text-xs text-gray-500">{subject.lastUpdated}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Patterns */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Learning Patterns</h3>
                <Clock className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Peak Learning Hours</p>
                  <div className="flex flex-wrap gap-2">
                    {analyticsData.learningPatterns.peakHours.map((hour, index) => (
                      <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                        {hour}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Completion Rate</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analyticsData.learningPatterns.completionRate}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="bg-emerald-500 h-2 rounded-full"
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {analyticsData.learningPatterns.completionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            {/* Performance Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Trends</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticsData.subjects.map((subject, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{subject.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-gray-900">{subject.score}%</span>
                        <span className={getTrendColor(subject.trend)}>
                          {getTrendIcon(subject.trend)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.score}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-3 rounded-full ${
                          subject.score >= 90 ? 'bg-green-500' :
                          subject.score >= 80 ? 'bg-emerald-500' :
                          subject.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Preferred Subjects</h4>
                  <div className="space-y-1">
                    {analyticsData.learningPatterns.preferredSubjects.map((subject, index) => (
                      <div key={index} className="text-sm text-gray-600">{subject}</div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Difficulty Level</h4>
                  <div className="text-2xl font-bold text-gray-900 capitalize">
                    {analyticsData.learningPatterns.difficultyLevel}
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Completion Rate</h4>
                  <div className="text-2xl font-bold text-gray-900">
                    {analyticsData.learningPatterns.completionRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {/* Next Week Prediction */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Prediction</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  {analyticsData.predictions.nextWeekScore}%
                </div>
                <p className="text-gray-600 mb-4">Predicted score for next week</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analyticsData.predictions.nextWeekScore}%` }}
                    transition={{ duration: 1 }}
                    className="bg-emerald-500 h-3 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Risk Areas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas Needing Attention</h3>
              <div className="space-y-3">
                {analyticsData.predictions.riskAreas.map((area, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
              <div className="space-y-3">
                {analyticsData.predictions.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                    <span className="text-gray-700">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parent' && isParentView && (
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600 mb-2">
                  {analyticsData.parentReport.overallProgress}%
                </div>
                <p className="text-gray-600 mb-4">Current academic performance</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analyticsData.parentReport.overallProgress}%` }}
                    transition={{ duration: 1 }}
                    className="bg-emerald-500 h-3 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Strengths and Areas for Improvement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths</h3>
                <div className="space-y-2">
                  {analyticsData.parentReport.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
                <div className="space-y-2">
                  {analyticsData.parentReport.areasForImprovement.map((area, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-700">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Engagement and Attendance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Level</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-emerald-600 mb-2">
                    {analyticsData.parentReport.engagement}%
                  </div>
                  <p className="text-gray-600">Active participation in learning</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {analyticsData.parentReport.attendance}%
                  </div>
                  <p className="text-gray-600">Regular class attendance</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

