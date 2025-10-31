"use client";

import React, { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock,
  Award,
  RefreshCw,
  Download,
  Settings,
  Brain
} from 'lucide-react';
import toast from 'react-hot-toast';
import ClassroomManager from '@/components/ClassroomManager';
import SchoolAdminDashboard from '@/components/SchoolAdminDashboard';
import AdminUserCreation from '@/components/AdminUserCreation';

interface ProgressData {
  classMetrics: {
    totalStudents: number;
    averageScore: number;
    completionRate: number;
    totalSubmissions: number;
    totalTimeSaved: number;
  };
  heatmap: {
    topic: string;
    percentage: number;
    studentCount: number;
  }[];
  studentProgress: {
    studentId: string;
    displayName: string;
    metrics: {
      totalSubmissions: number;
      averageScore: number;
      weaknesses: string[];
      strengths: string[];
      personalityType: string;
      lastActivity: string | null;
    };
  }[];
}

export default function AdminDashboard() {
  const { user } = useRole();
  const router = useRouter();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'classrooms' | 'analytics' | 'school' | 'users'>('overview');

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (user) {
      fetchProgressData();
      fetchEnhancedDashboardData();
      fetchReports();
    }
  }, [user, router]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/progress?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Ensure all required fields have default values
        const processedData = {
          classMetrics: {
            totalStudents: data.data.classMetrics?.totalStudents || 0,
            averageScore: data.data.classMetrics?.averageScore || 0,
            completionRate: data.data.classMetrics?.completionRate || 0,
            totalSubmissions: data.data.classMetrics?.totalSubmissions || 0,
            totalTimeSaved: data.data.classMetrics?.totalTimeSaved || 0,
          },
          heatmap: data.data.heatmap || [],
          studentProgress: data.data.studentProgress || [],
        };
        setProgressData(processedData);
      } else {
        toast.error('Failed to fetch progress data');
        // Set empty data structure to prevent errors
        setProgressData({
          classMetrics: {
            totalStudents: 0,
            averageScore: 0,
            completionRate: 0,
            totalSubmissions: 0,
            totalTimeSaved: 0,
          },
          heatmap: [],
          studentProgress: [],
        });
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to fetch progress data');
      // Set empty data structure to prevent errors
      setProgressData({
        classMetrics: {
          totalStudents: 0,
          averageScore: 0,
          completionRate: 0,
          totalSubmissions: 0,
          totalTimeSaved: 0,
        },
        heatmap: [],
        studentProgress: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: user?.role,
          userId: user?.userId,
          classId: user?.classId,
          action: 'refresh',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Progress data refreshed successfully');
        fetchProgressData();
      } else {
        toast.error('Failed to refresh progress data');
      }
    } catch (error) {
      console.error('Error refreshing progress:', error);
      toast.error('Failed to refresh progress data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearDatabase = async () => {
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Database cleared successfully!');
        fetchProgressData();
      } else {
        toast.error('Failed to clear database');
      }
    } catch (error) {
      console.error('Error clearing database:', error);
      toast.error('Failed to clear database');
    }
  };

  const fetchEnhancedDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}&schoolId=${user?.schoolId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        console.error('Failed to fetch enhanced dashboard data');
      }
    } catch (error) {
      console.error('Error fetching enhanced dashboard data:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(data.data.reports || []);
      } else {
        console.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleGenerateReport = async (format: 'PDF' | 'Excel', reportType: 'progress' | 'analytics' | 'parent_summary') => {
    setReportLoading(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: user?.role,
          userId: user?.userId,
          classId: user?.classId,
          format,
          reportType,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`${format} report generated successfully!`);
        
        // Open the report in a new tab
        window.open(data.data.reportUrl, '_blank');
        
        // Refresh reports list
        fetchReports();
      } else {
        toast.error(`Failed to generate ${format} report`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  const exportProgressReport = () => {
    if (!progressData) return;
    
    const reportData = {
      generatedAt: new Date().toISOString(),
      classMetrics: progressData.classMetrics,
      heatmap: progressData.heatmap,
      studentProgress: progressData.studentProgress,
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-progress-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Progress report exported successfully');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in as an admin to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor class performance and manage the Ionia AI system.
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleClearDatabase}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Clear Database
            </button>
            
            <button
              onClick={handleRefreshData}
              disabled={refreshing}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            
            <button
              onClick={exportProgressReport}
              disabled={!progressData}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveSection('classrooms')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'classrooms'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Classrooms
            </button>
            <button
              onClick={() => setActiveSection('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'analytics'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setActiveSection('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'users'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              User Management
            </button>
            <button
              onClick={() => setActiveSection('school')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'school'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              School Management
            </button>
          </nav>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && progressData ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{progressData.classMetrics.totalStudents || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Class Average</p>
                    <p className="text-2xl font-bold text-gray-900">{progressData.classMetrics.averageScore || 0}%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{progressData.classMetrics.completionRate || 0}%</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-gray-900">{progressData.classMetrics.totalSubmissions || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Time Saved</p>
                    <p className="text-2xl font-bold text-gray-900">{Math.floor((progressData.classMetrics.totalTimeSaved || 0) / 60)}h</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Class Weaknesses Heatmap */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Class Weaknesses Heatmap</h2>
                  
                  {(progressData.heatmap || []).length > 0 ? (
                    <div className="space-y-4">
                      {(progressData.heatmap || []).map((item, index) => (
                        <div key={item.topic} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              item.percentage > 60 ? 'bg-red-500' :
                              item.percentage > 30 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {item.topic.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  item.percentage > 60 ? 'bg-red-500' :
                                  item.percentage > 30 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {item.percentage}%
                            </span>
                            <span className="text-xs text-gray-500 w-8 text-right">
                              ({item.studentCount})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      No weakness data available yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Student Performance Table */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Performance Overview</h2>
                  
                  {(progressData.studentProgress || []).length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-2 font-medium text-gray-700">Student</th>
                            <th className="text-center py-3 px-2 font-medium text-gray-700">Submissions</th>
                            <th className="text-center py-3 px-2 font-medium text-gray-700">Avg Score</th>
                            <th className="text-center py-3 px-2 font-medium text-gray-700">Personality</th>
                            <th className="text-left py-3 px-2 font-medium text-gray-700">Weaknesses</th>
                            <th className="text-center py-3 px-2 font-medium text-gray-700">Last Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(progressData.studentProgress || []).map((student) => (
                            <tr key={student.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2">
                                <div className="font-medium text-gray-900">{student.displayName}</div>
                                <div className="text-xs text-gray-500">{student.studentId}</div>
                              </td>
                              <td className="text-center py-3 px-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-blue-800">
                                  {student.metrics.totalSubmissions || 0}
                                </span>
                              </td>
                              <td className="text-center py-3 px-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  (student.metrics.averageScore || 0) >= 80 ? 'bg-green-100 text-green-800' :
                                  (student.metrics.averageScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {student.metrics.averageScore || 0}%
                                </span>
                              </td>
                              <td className="text-center py-3 px-2">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 capitalize">
                                  {student.metrics.personalityType || 'Unknown'}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex flex-wrap gap-1">
                                  {(student.metrics.weaknesses || []).slice(0, 2).map((weakness) => (
                                    <span key={weakness} className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                                      {weakness.replace('-', ' ')}
                                    </span>
                                  ))}
                                  {(student.metrics.weaknesses || []).length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{(student.metrics.weaknesses || []).length - 2}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center py-3 px-2 text-xs text-gray-500">
                                {student.metrics.lastActivity 
                                  ? new Date(student.metrics.lastActivity).toLocaleDateString()
                                  : 'Never'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No student data available yet.</p>
                      <p className="text-sm text-gray-400">Students will appear here once they start submitting assignments.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Insights */}
            <div className="mt-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">System Insights</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Performance Trend</h3>
                    <p className="text-sm text-gray-600">
                      AI personalization is helping improve student learning outcomes
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Time Efficiency</h3>
                    <p className="text-sm text-gray-600">
                      Teachers save an average of {progressData.classMetrics.totalStudents > 0 ? Math.floor(progressData.classMetrics.totalTimeSaved / progressData.classMetrics.totalStudents / 60) : 0} hours per week on grading
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">Engagement Rate</h3>
                    <p className="text-sm text-gray-600">
                      {progressData.classMetrics.completionRate || 0}% of assignments are completed on time
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Generation Section */}
            <div className="mt-8">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-xl border border-emerald-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Download className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Generate Reports</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Analytics Report */}
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <h3 className="font-medium text-gray-900 mb-2">Analytics Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Comprehensive class performance and learning analytics
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleGenerateReport('PDF', 'analytics')}
                        disabled={reportLoading}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {reportLoading ? 'Generating...' : 'Generate PDF'}
                      </button>
                      <button
                        onClick={() => handleGenerateReport('Excel', 'analytics')}
                        disabled={reportLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {reportLoading ? 'Generating...' : 'Generate Excel'}
                      </button>
                    </div>
                  </div>

                  {/* Progress Report */}
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <h3 className="font-medium text-gray-900 mb-2">Progress Report</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Individual student progress and performance tracking
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleGenerateReport('PDF', 'progress')}
                        disabled={reportLoading}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {reportLoading ? 'Generating...' : 'Generate PDF'}
                      </button>
                      <button
                        onClick={() => handleGenerateReport('Excel', 'progress')}
                        disabled={reportLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {reportLoading ? 'Generating...' : 'Generate Excel'}
                      </button>
                    </div>
                  </div>

                  {/* Parent Summary */}
                  <div className="bg-white rounded-lg p-4 border border-emerald-100">
                    <h3 className="font-medium text-gray-900 mb-2">Parent Summary</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Parent-friendly progress summaries and recommendations
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleGenerateReport('PDF', 'parent_summary')}
                        disabled={reportLoading}
                        className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {reportLoading ? 'Generating...' : 'Generate PDF'}
                      </button>
                      <button
                        onClick={() => handleGenerateReport('Excel', 'parent_summary')}
                        disabled={reportLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                      >
                        {reportLoading ? 'Generating...' : 'Generate Excel'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Reports */}
                {reports.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium text-gray-900 mb-3">Recent Reports</h3>
                    <div className="space-y-2">
                      {reports.slice(0, 5).map((report, index) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-emerald-100">
                          <div className="flex items-center space-x-3">
                            <Download className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {report.type.replace('_', ' ').toUpperCase()} - {report.format}
                              </p>
                              <p className="text-xs text-gray-500">
                                Generated {new Date(report.generatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <a
                            href={report.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-6">
              There's no progress data to display yet. This could be because:
            </p>
            <ul className="text-sm text-gray-500 mb-8 space-y-2">
              <li>• No students have submitted assignments yet</li>
              <li>• The database is empty - no users or data</li>
              <li>• There was an error loading the data</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleClearDatabase}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Clear Database to Get Started
              </button>
              <button
                onClick={handleRefreshData}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Data
              </button>
            </div>
          </div>
        )}

        {/* Classrooms Section */}
        {activeSection === 'classrooms' && (
          <div className="space-y-6">
            <ClassroomManager
              userId={user?.userId || ''}
              userName={user?.name || user?.displayName || 'Admin'}
              role="admin"
              schoolId={user?.schoolId?.toString() || ''}
              onClassSelected={(classId) => {
                // TODO: Handle class selection
              }}
            />
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Analytics</h2>
              <p className="text-gray-600">
                Advanced analytics and reporting features will be available here.
              </p>
            </div>
          </div>
        )}

        {/* User Management Section */}
        {activeSection === 'users' && user && user.schoolId && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
              <p className="text-gray-600">
                Create and manage teachers, students, and admins for your school.
                All accounts will have auto-generated credentials that you must save securely.
              </p>
            </div>
            
            <AdminUserCreation
              adminUserId={user.userId || ''}
              adminRole={user.role}
              schoolId={user.schoolId.toString()}
            />
          </div>
        )}

        {/* School Management Section */}
        {activeSection === 'school' && user && (
          <div className="space-y-6">
            <SchoolAdminDashboard userId={user.userId || ''} />
          </div>
        )}
      </div>
    </div>
  );
}
