"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  BookOpen,
  Users,
  Award,
  Zap,
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  Search,
  Edit,
  Eye
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import toast from 'react-hot-toast';
import { useRole } from '@/contexts/RoleContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressData {
  planId: string;
  subject: string;
  grade: string;
  academicYear: string;
  totalTopics: number;
  completedTopics: number;
  completionPercentage: number;
  lastUpdated: string;
  weeklyProgress: Array<{
    week: string;
    startDate: string;
    endDate: string;
    completed: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    completed: number;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    scheduledDate: string;
    difficulty: string;
  }>;
  behindSchedule: number;
  onTrack: number;
}

interface Topic {
  id: string;
  title: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedHours: number;
  completed: boolean;
  completedDate?: string;
  weekNumber: number;
  monthNumber: number;
  notes?: string;
}

interface CurriculumProgressDashboardProps {
  planId: string;
  onBack: () => void;
}

export default function CurriculumProgressDashboard({ planId, onBack }: CurriculumProgressDashboardProps) {
  const { user } = useRole();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'topics' | 'timeline' | 'analytics'>('overview');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user && planId) {
      fetchProgressData();
    }
  }, [user, planId]);

  const fetchProgressData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/academic-planner/progress?planId=${planId}&teacherId=${user.mockUserId}&role=${user.role}`);
      const data = await response.json();

      if (data.success) {
        setProgressData(data.progress);
        // Fetch detailed topics from the academic plan
        await fetchTopics();
      } else {
        toast.error(data.error || 'Failed to fetch progress data');
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
      toast.error('Failed to fetch progress data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch(`/api/academic-planner?teacherId=${user?.mockUserId}&role=${user?.role}`);
      const data = await response.json();

      if (data.success) {
        const plan = data.academicPlans.find((p: any) => p._id === planId);
        if (plan && plan.generatedPlan && plan.generatedPlan.topics) {
          setTopics(plan.generatedPlan.topics);
        }
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const updateTopicProgress = async (topicId: string, completed: boolean, notes?: string) => {
    if (!user) return;
    
    setUpdateLoading(true);
    try {
      const topicUpdates = [{
        topicId,
        completed,
        notes: notes || ''
      }];

      const response = await fetch('/api/academic-planner/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          teacherId: user.mockUserId,
          role: user.role,
          topicUpdates
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Progress updated successfully');
        fetchProgressData();
      } else {
        toast.error(data.error || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (completed: boolean, isOverdue: boolean = false) => {
    if (completed) return 'text-green-600 bg-green-100';
    if (isOverdue) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const filteredTopics = topics.filter(topic => {
    const matchesDifficulty = filterDifficulty === 'all' || topic.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'completed' && topic.completed) ||
      (filterStatus === 'pending' && !topic.completed);
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDifficulty && matchesStatus && matchesSearch;
  });

  // Chart configurations
  const weeklyProgressChart = {
    labels: progressData?.weeklyProgress.map(w => w.week) || [],
    datasets: [
      {
        label: 'Topics Completed',
        data: progressData?.weeklyProgress.map(w => w.completed) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const monthlyProgressChart = {
    labels: progressData?.monthlyProgress.map(m => m.month) || [],
    datasets: [
      {
        label: 'Topics Completed',
        data: progressData?.monthlyProgress.map(m => m.completed) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
    ],
  };

  const completionChart = {
    labels: ['Completed', 'Remaining'],
    datasets: [
      {
        data: [
          progressData?.completedTopics || 0,
          (progressData?.totalTopics || 0) - (progressData?.completedTopics || 0)
        ],
        backgroundColor: ['#10b981', '#e5e7eb'],
        borderWidth: 0,
      },
    ],
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Progress</p>
              <p className="text-3xl font-bold text-emerald-600">{progressData?.completionPercentage || 0}%</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Topics</p>
              <p className="text-3xl font-bold text-blue-600">{progressData?.completedTopics || 0}</p>
              <p className="text-sm text-gray-500">of {progressData?.totalTopics || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On Track</p>
              <p className="text-3xl font-bold text-green-600">{progressData?.onTrack || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Behind Schedule</p>
              <p className="text-3xl font-bold text-red-600">{progressData?.behindSchedule || 0}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <Line data={weeklyProgressChart} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Completion Overview</h3>
          <Doughnut data={completionChart} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {progressData?.upcomingDeadlines && progressData.upcomingDeadlines.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {progressData.upcomingDeadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                  <p className="text-sm text-gray-600">
                    Due: {new Date(deadline.scheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(deadline.difficulty)}`}>
                  {deadline.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTopics = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Difficulties</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {filteredTopics.map((topic) => (
          <div key={topic.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <button
                    onClick={() => updateTopicProgress(topic.id, !topic.completed)}
                    disabled={updateLoading}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      topic.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-emerald-500'
                    }`}
                  >
                    {topic.completed && <CheckCircle className="w-4 h-4" />}
                  </button>
                  <h3 className={`text-lg font-semibold ${topic.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {topic.title}
                  </h3>
                </div>

                <p className="text-gray-600 mb-4">{topic.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className={`px-2 py-1 rounded-full ${getDifficultyColor(topic.difficulty)}`}>
                    {topic.difficulty}
                  </span>
                  <span className="text-gray-600">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {topic.estimatedHours}h
                  </span>
                  <span className="text-gray-600">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Week {topic.weekNumber}
                  </span>
                  {topic.completed && topic.completedDate && (
                    <span className="text-green-600">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Completed {new Date(topic.completedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {topic.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{topic.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const notes = prompt('Add notes for this topic:', topic.notes || '');
                    if (notes !== null) {
                      updateTopicProgress(topic.id, topic.completed, notes);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTopics.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Plans</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {progressData?.subject} Progress - Grade {progressData?.grade}
              </h1>
              <p className="text-gray-600">Academic Year: {progressData?.academicYear}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchProgressData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'topics', label: 'Topics', icon: BookOpen },
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'topics' && renderTopics()}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline View</h3>
            <p className="text-gray-600">Timeline view coming soon...</p>
          </div>
        )}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Monthly Progress Trend</h4>
                <Bar data={monthlyProgressChart} options={{ responsive: true, maintainAspectRatio: false }} height={300} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Completion Statistics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average completion time:</span>
                    <span className="font-medium">2.5 weeks per topic</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projected completion:</span>
                    <span className="font-medium">March 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current pace:</span>
                    <span className="font-medium text-green-600">On track</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
