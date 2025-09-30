"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  Clock,
  Copy,
  CheckCircle,
  Edit,
  Settings,
  BarChart3,
  FileText,
  Plus,
  Trash2,
  MessageCircle,
  Eye,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ClassDetails {
  class: {
    _id: string;
    className: string;
    description?: string;
    subject?: string;
    grade?: string;
    teacherMockId: string;
    studentMockIds: string[];
    joinCode: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  students: Array<{
    studentMockId: string;
    name: string;
    email: string;
    personalityTestCompleted?: boolean;
    oceanTraits?: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    learningPreferences?: {
      visualLearner: boolean;
      auditoryLearner: boolean;
      kinestheticLearner: boolean;
      readingWritingLearner: boolean;
      preferredDifficulty: string;
    };
  }>;
  statistics: {
    totalStudents: number;
    totalAssignments: number;
    totalSubmissions: number;
    gradedSubmissions: number;
    averageScore: number;
    completionRate: number;
  };
  recentAssignments: Array<{
    _id: string;
    title: string;
    subject: string;
    dueDate?: string;
    createdAt: string;
  }>;
  recentSubmissions: Array<{
    _id: string;
    studentName: string;
    submissionTime: string;
    status: string;
    score?: number;
  }>;
}

export default function ClassroomPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useRole();
  const classId = params.classId as string;

  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'assignments' | 'analytics'>('overview');

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.push('/');
      return;
    }
    
    if (classId && user) {
      fetchClassDetails();
    }
  }, [classId, user, router]);

  const fetchClassDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/classes/${classId}?role=${user?.role}&mockUserId=${user?.mockUserId}`);
      const data = await response.json();

      if (data.success) {
        setClassDetails(data.data);
      } else {
        toast.error(data.error || 'Failed to load class details');
        router.push('/teacher');
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
      toast.error('Failed to load class details');
      router.push('/teacher');
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = (joinCode: string) => {
    navigator.clipboard.writeText(joinCode);
    setCopiedJoinCode(true);
    toast.success('Join code copied to clipboard!');
    setTimeout(() => setCopiedJoinCode(false), 2000);
  };

  const handleBackToClassrooms = () => {
    router.push('/teacher');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classroom details...</p>
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return null;
  }

  const { class: classInfo, statistics, recentAssignments, recentSubmissions } = classDetails;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToClassrooms}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Classrooms
          </button>

          <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl shadow-lg p-8 text-white">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{classInfo.className}</h1>
                {classInfo.description && (
                  <p className="text-emerald-50 text-lg mb-4">{classInfo.description}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  {classInfo.subject && (
                    <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                      📚 {classInfo.subject}
                    </span>
                  )}
                  {classInfo.grade && (
                    <span className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                      🎓 Grade {classInfo.grade}
                    </span>
                  )}
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    classInfo.isActive 
                      ? 'bg-green-500 bg-opacity-30' 
                      : 'bg-red-500 bg-opacity-30'
                  }`}>
                    {classInfo.isActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toast.info('Edit classroom coming soon!')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-colors"
                  title="Edit classroom"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => toast.info('Settings coming soon!')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-colors"
                  title="Classroom settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Join Code Card */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-50 text-sm mb-1">Student Join Code</p>
                  <code className="text-2xl font-mono font-bold">{classInfo.joinCode}</code>
                </div>
                <button
                  onClick={() => copyJoinCode(classInfo.joinCode)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                >
                  {copiedJoinCode ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalStudents}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Assignments</p>
            <p className="text-3xl font-bold text-gray-900">{statistics.totalAssignments}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Average Score</p>
            <p className="text-3xl font-bold text-gray-900">{statistics.averageScore}%</p>
          </motion.div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalSubmissions}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Graded Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.gradedSubmissions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.completionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Students ({statistics.totalStudents})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Assignments ({statistics.totalAssignments})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Assignments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Recent Assignments
                </h3>
                <button
                  onClick={() => router.push('/teacher#create')}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Create New
                </button>
              </div>
              {recentAssignments.length > 0 ? (
                <div className="space-y-3">
                  {recentAssignments.map((assignment) => (
                    <div key={assignment._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{assignment.title}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {assignment.subject}
                            </span>
                            {assignment.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No assignments yet</p>
                  <button
                    onClick={() => router.push('/teacher#create')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create First Assignment
                  </button>
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Recent Submissions
                </h3>
                <button
                  onClick={() => router.push('/teacher#grading')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              {recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.map((submission) => (
                    <div key={submission._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{submission.studentName}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(submission.submissionTime).toLocaleDateString()}
                            </span>
                            <span className={`capitalize font-medium ${
                              submission.status === 'graded' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {submission.status}
                            </span>
                          </div>
                        </div>
                        {submission.score !== undefined && (
                          <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-lg font-bold">
                            {submission.score}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No submissions yet</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Submissions will appear here once students start submitting assignments
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Students ({classDetails?.students?.length || 0})</h3>
            </div>
            
            {classDetails?.students && classDetails.students.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {classDetails.students.map((student, index) => (
                  <div key={student.studentMockId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">ID: {student.studentMockId}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {student.personalityTestCompleted ? (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm text-emerald-600 font-medium">OCEAN Complete</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-500">Pending Test</span>
                          </div>
                        )}
                        
                        {student.learningPreferences && (
                          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {student.learningPreferences.visualLearner && '👁️ Visual'}
                            {student.learningPreferences.auditoryLearner && ' 🎧 Auditory'}
                            {student.learningPreferences.kinestheticLearner && ' 🤸 Kinesthetic'}
                            {student.learningPreferences.readingWritingLearner && ' 📖 R/W'}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {student.oceanTraits && (
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Openness</div>
                          <div className="text-sm font-semibold text-emerald-600">{student.oceanTraits.openness}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Conscient.</div>
                          <div className="text-sm font-semibold text-blue-600">{student.oceanTraits.conscientiousness}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Extraver.</div>
                          <div className="text-sm font-semibold text-purple-600">{student.oceanTraits.extraversion}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Agreeable.</div>
                          <div className="text-sm font-semibold text-pink-600">{student.oceanTraits.agreeableness}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Neuroticism</div>
                          <div className="text-sm font-semibold text-orange-600">{student.oceanTraits.neuroticism}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Yet</h3>
                <p className="text-gray-600 mb-6">
                  Share the join code with students to add them to this classroom
                </p>
                <button
                  onClick={() => copyJoinCode(classDetails?.class.joinCode || '')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Join Code</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                All Assignments ({classDetails?.statistics.totalAssignments || 0})
              </h3>
              <button
                onClick={() => router.push('/teacher#create')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </button>
            </div>
            
            {classDetails?.recentAssignments && classDetails.recentAssignments.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {classDetails.recentAssignments.map((assignment) => (
                  <div 
                    key={assignment._id} 
                    className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      // View assignment details
                      router.push(`/teacher/assignment/${assignment._id}`);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-base font-medium text-gray-900">{assignment.title}</h4>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {assignment.subject}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          {assignment.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Created: {new Date(assignment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/teacher/assignment/${assignment._id}/edit`);
                          }}
                          className="text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/teacher/assignment/${assignment._id}`);
                          }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your first assignment for this classroom
                </p>
                <button
                  onClick={() => router.push('/teacher#create')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create First Assignment</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Classroom Analytics</h3>
              <p className="text-gray-600 mb-6">
                Detailed analytics and insights about this classroom's performance
              </p>
              <button
                onClick={() => router.push('/teacher#analytics')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                View Analytics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
