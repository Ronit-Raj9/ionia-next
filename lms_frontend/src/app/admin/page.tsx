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
  Brain,
  Edit,
  Ban,
  Unlock,
  Trash2,
  Search,
  X,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import ClassroomManager from '@/components/ClassroomManager';
import SchoolAdminDashboard from '@/components/SchoolAdminDashboard';
import AdminUserCreation from '@/components/AdminUserCreation';
import BulkClassEnrollment from '@/components/BulkClassEnrollment';

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
  
  // User management state
  const [schoolUsers, setSchoolUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: '',
    status: 'active',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<'confirm' | 'type'>('confirm');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

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
      if (activeSection === 'users') {
        fetchSchoolUsers();
      }
    }
  }, [user, router, activeSection]);

  const fetchProgressData = async () => {
    setLoading(true);
    try {
      // For admins, we need to fetch progress for all classes in their school
      // Since admins don't have a classId, we'll fetch all classes first
      let progressUrl = `/api/progress?role=${user?.role}&userId=${user?.userId}`;
      
      // If admin, fetch all classes in school and aggregate progress
      if (user?.role === 'admin' && user?.schoolId) {
        // Fetch all classes for the school
        const classesResponse = await fetch(`/api/classes/school?schoolId=${user.schoolId}&role=admin&userId=${user.userId}`);
        const classesData = await classesResponse.json();
        
        if (classesData.success && classesData.data && classesData.data.length > 0) {
          // Aggregate progress from all classes
          const allProgressData = await Promise.all(
            classesData.data.map(async (classItem: any) => {
              try {
                const classProgressResponse = await fetch(
                  `/api/progress?role=${user?.role}&userId=${user?.userId}&classId=${classItem._id}&schoolId=${user.schoolId}`
                );
                const classProgressData = await classProgressResponse.json();
                return classProgressData.success ? classProgressData.data : null;
              } catch (err) {
                console.error(`Error fetching progress for class ${classItem._id}:`, err);
                return null;
              }
            })
          );

          // Aggregate all progress data
          const aggregatedMetrics = {
            totalStudents: 0,
            averageScore: 0,
            completionRate: 0,
            totalSubmissions: 0,
            totalTimeSaved: 0,
          };
          
          const allHeatmap: Record<string, { percentage: number; studentCount: number }> = {};
          const allStudentProgress: any[] = [];
          let totalScore = 0;
          let scoreCount = 0;
          let totalCompletionRate = 0;
          let completionRateCount = 0;

          allProgressData.forEach((classData) => {
            if (!classData) return;
            
            const metrics = classData.classMetrics || {};
            aggregatedMetrics.totalStudents += metrics.totalStudents || 0;
            aggregatedMetrics.totalSubmissions += metrics.totalSubmissions || 0;
            aggregatedMetrics.totalTimeSaved += metrics.totalTimeSaved || 0;
            
            if (metrics.averageScore) {
              totalScore += metrics.averageScore;
              scoreCount++;
            }
            
            // Aggregate completion rate
            if (metrics.completionRate !== undefined) {
              totalCompletionRate += metrics.completionRate;
              completionRateCount++;
            }
            
            // Aggregate heatmap
            (classData.heatmap || []).forEach((item: any) => {
              if (!allHeatmap[item.topic]) {
                allHeatmap[item.topic] = { percentage: 0, studentCount: 0 };
              }
              allHeatmap[item.topic].studentCount += item.studentCount || 0;
            });
            
            // Collect student progress
            (classData.studentProgress || []).forEach((student: any) => {
              allStudentProgress.push(student);
            });
          });

          // Calculate averages
          aggregatedMetrics.averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
          aggregatedMetrics.completionRate = completionRateCount > 0 
            ? Math.round(totalCompletionRate / completionRateCount)
            : 0;
          
          // Recalculate heatmap percentages
          const heatmapArray = Object.entries(allHeatmap).map(([topic, data]) => ({
            topic,
            percentage: aggregatedMetrics.totalStudents > 0 
              ? Math.round((data.studentCount / aggregatedMetrics.totalStudents) * 100)
              : 0,
            studentCount: data.studentCount,
          })).sort((a, b) => b.percentage - a.percentage);

          const processedData = {
            classMetrics: aggregatedMetrics,
            heatmap: heatmapArray,
            studentProgress: allStudentProgress,
          };
          
          setProgressData(processedData);
          return;
        }
      } else {
        // For teachers, use classId
        progressUrl += `&classId=${user?.classId || ''}`;
        if (user?.schoolId) {
          progressUrl += `&schoolId=${user.schoolId}`;
        }
      }

      const response = await fetch(progressUrl);
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
      // For admins, refresh all classes in their school
      if (user?.role === 'admin' && user?.schoolId) {
        // Fetch all classes for the school
        const classesResponse = await fetch(`/api/classes/school?schoolId=${user.schoolId}&role=admin&userId=${user.userId}`);
        const classesData = await classesResponse.json();
        
        if (classesData.success && classesData.data && classesData.data.length > 0) {
          // Refresh progress for each class
          const refreshPromises = classesData.data.map(async (classItem: any) => {
            try {
              const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  role: user?.role,
                  userId: user?.userId,
                  classId: classItem._id,
                  schoolId: user?.schoolId,
                  action: 'refresh',
                }),
              });
              return response.json();
            } catch (err) {
              console.error(`Error refreshing progress for class ${classItem._id}:`, err);
              return { success: false };
            }
          });

          const results = await Promise.all(refreshPromises);
          const successCount = results.filter(r => r.success).length;
          
          if (successCount > 0) {
            toast.success(`Progress data refreshed successfully for ${successCount} class(es)`);
            fetchProgressData(); // Refresh the displayed data
          } else {
            toast.error('Failed to refresh progress data for any classes');
          }
        } else {
          toast.error('No classes found to refresh');
        }
      } else {
        // For teachers, refresh single class
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: user?.role,
            userId: user?.userId,
            classId: user?.classId,
            schoolId: user?.schoolId,
            action: 'refresh',
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('Progress data refreshed successfully');
          fetchProgressData();
        } else {
          toast.error(data.error || 'Failed to refresh progress data');
        }
      }
    } catch (error) {
      console.error('Error refreshing progress:', error);
      toast.error('Failed to refresh progress data');
    } finally {
      setRefreshing(false);
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

  const fetchSchoolUsers = async () => {
    if (!user?.schoolId) return;
    
    setLoadingUsers(true);
    try {
      // Fetch students and teachers from the admin's school
      const [studentsRes, teachersRes] = await Promise.all([
        fetch(`/api/users?schoolId=${user.schoolId}&role=student`),
        fetch(`/api/users?schoolId=${user.schoolId}&role=teacher`),
      ]);

      const studentsData = await studentsRes.json();
      const teachersData = await teachersRes.json();

      const allUsers = [
        ...(studentsData.success ? studentsData.data || [] : []),
        ...(teachersData.success ? teachersData.data || [] : []),
      ];

      setSchoolUsers(allUsers);
    } catch (error) {
      console.error('Error fetching school users:', error);
      toast.error('Failed to fetch users');
      setSchoolUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleBlockUser = async (userId: string, currentStatus: string) => {
    if (!confirm(`Are you sure you want to block this user?`)) {
      return;
    }

    try {
      const status = currentStatus === 'suspended' ? 'suspended' : 'inactive';
      const response = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User blocked successfully`);
        fetchSchoolUsers();
      } else {
        toast.error(data.error || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User unblocked successfully');
        fetchSchoolUsers();
      } else {
        toast.error(data.error || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  const handleEditUser = (userAccount: any) => {
    setSelectedUser(userAccount);
    setEditForm({
      name: userAccount.name,
      email: userAccount.email,
      phoneNumber: userAccount.phoneNumber || '',
      role: userAccount.role,
      status: userAccount.status,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          updates: editForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchSchoolUsers();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userAccount: any) => {
    setUserToDelete(userAccount);
    setDeleteConfirmationStep('confirm');
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmStep1 = () => {
    if (deleteConfirmationStep === 'confirm') {
      setDeleteConfirmationStep('type');
    }
  };

  const handleDeleteConfirmStep2 = async () => {
    if (!userToDelete) return;

    if (deleteConfirmText.trim().toLowerCase() !== 'delete this user') {
      toast.error('Please type "delete this user" exactly to confirm');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/users?userId=${userToDelete.userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User deleted successfully');
        setShowDeleteModal(false);
        setUserToDelete(null);
        setDeleteConfirmationStep('confirm');
        setDeleteConfirmText('');
        fetchSchoolUsers();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = schoolUsers.filter((userAccount) => {
    const matchesSearch = !searchTerm.trim() || 
      userAccount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userAccount.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userAccount.userId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || userAccount.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

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
              <li>• There was an error loading the data</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                Create and manage teachers and students for your school.
                All accounts will have auto-generated credentials that you must save securely.
              </p>
            </div>
            
            {/* Create Users Section */}
            <AdminUserCreation
              adminUserId={user.userId || ''}
              adminRole={user.role}
              schoolId={user.schoolId.toString()}
            />

            {/* Manage Existing Users Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Manage Users</h2>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                  </select>
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((userAccount) => (
                        <tr key={userAccount._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{userAccount.name}</div>
                              <div className="text-sm text-gray-500">{userAccount.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">{userAccount.userId}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userAccount.role === 'teacher' ? 'bg-green-100 text-green-800' :
                              userAccount.role === 'student' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {userAccount.role.charAt(0).toUpperCase() + userAccount.role.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userAccount.status === 'active' ? 'bg-green-100 text-green-800' :
                              userAccount.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {userAccount.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(userAccount.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditUser(userAccount)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                title="Edit User"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {userAccount.status === 'active' ? (
                                <button
                                  onClick={() => handleBlockUser(userAccount.userId, userAccount.status)}
                                  className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  title="Block User"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnblockUser(userAccount.userId)}
                                  className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  title="Unblock User"
                                >
                                  <Unlock className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(userAccount)}
                                className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">No users found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={editForm.phoneNumber}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        required
                        value={editForm.status}
                        onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setSelectedUser(null);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Updating...' : 'Update User'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete User Confirmation Modal */}
            {showDeleteModal && userToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                  {deleteConfirmationStep === 'confirm' ? (
                    <>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
                          <p className="text-sm text-gray-600">This action cannot be undone</p>
                        </div>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-red-800">
                          <strong>Warning:</strong> You are about to permanently delete this user:
                        </p>
                        <div className="mt-2 text-sm text-red-900">
                          <p><strong>Name:</strong> {userToDelete.name}</p>
                          <p><strong>Email:</strong> {userToDelete.email}</p>
                          <p><strong>User ID:</strong> {userToDelete.userId}</p>
                          <p><strong>Role:</strong> {userToDelete.role.charAt(0).toUpperCase() + userToDelete.role.slice(1)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowDeleteModal(false);
                            setUserToDelete(null);
                            setDeleteConfirmationStep('confirm');
                            setDeleteConfirmText('');
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteConfirmStep1}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Yes, Continue
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Final Confirmation</h3>
                          <p className="text-sm text-gray-600">Type "delete this user" to confirm</p>
                        </div>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-red-800 mb-2">
                          <strong>This is a destructive action!</strong> Deleting this user will permanently remove:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-900 space-y-1">
                          <li>User account and all associated data</li>
                          <li>All submissions and progress records</li>
                          <li>Class enrollments and assignments</li>
                        </ul>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type "delete this user" to confirm:
                        </label>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="delete this user"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          autoFocus
                        />
                        {deleteConfirmText.trim().toLowerCase() !== 'delete this user' && deleteConfirmText.length > 0 && (
                          <p className="mt-1 text-xs text-red-600">Text doesn't match. Please type exactly: "delete this user"</p>
                        )}
                      </div>

                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowDeleteModal(false);
                            setUserToDelete(null);
                            setDeleteConfirmationStep('confirm');
                            setDeleteConfirmText('');
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteConfirmStep2}
                          disabled={deleting || deleteConfirmText.trim().toLowerCase() !== 'delete this user'}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting ? (
                            <>
                              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                              Deleting...
                            </>
                          ) : (
                            'Delete User Permanently'
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
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
