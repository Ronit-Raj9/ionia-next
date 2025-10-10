"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Download,
  Eye,
  BarChart3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AssignmentDetails {
  _id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  topic: string;
  difficulty: string;
  totalMarks: number;
  dueDate?: string;
  createdAt: string;
  uploadedFileUrl?: string;
  originalContent: {
    questions: string[];
    questionDetails?: Array<{id: string, text: string, marks: number}>;
  };
  assignedTo: string[];
  personalizedVersions: Array<{
    studentMockId: string;
    studentName?: string;
    personalizationReason: string;
    adaptedContent: any;
  }>;
  submissionStats: {
    totalStudents: number;
    submitted: number;
    graded: number;
    pending: number;
  };
  gradeSettings: {
    showMarksToStudents: boolean;
    showFeedbackToStudents: boolean;
  };
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useRole();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'submissions'>('overview');

  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.push('/');
      return;
    }
    
    if (assignmentId && user) {
      fetchAssignmentDetails();
    }
  }, [assignmentId, user, router]);

  const fetchAssignmentDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assignments/${assignmentId}?role=${user?.role}&mockUserId=${user?.mockUserId}`);
      const data = await response.json();

      if (data.success) {
        setAssignment(data.data);
      } else {
        toast.error(data.error || 'Failed to load assignment');
        router.push('/teacher');
      }
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Failed to load assignment');
      router.push('/teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: user?.role,
          mockUserId: user?.mockUserId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Assignment deleted successfully');
        router.push('/teacher');
      } else {
        toast.error(data.error || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Assignment not found</h2>
        <button
          onClick={() => router.push('/teacher')}
          className="mt-4 text-emerald-600 hover:text-emerald-700"
        >
          Go back to dashboard
        </button>
      </div>
    );
  }

  const completionRate = assignment.submissionStats.totalStudents > 0
    ? Math.round((assignment.submissionStats.submitted / assignment.submissionStats.totalStudents) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
              {assignment.description && (
                <p className="mt-2 text-gray-600">{assignment.description}</p>
              )}
              
              <div className="flex items-center gap-4 mt-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {assignment.subject}
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  Grade {assignment.grade}
                </span>
                {assignment.topic && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {assignment.topic}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  assignment.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  assignment.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/teacher/assignment/${assignmentId}/edit`)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{assignment.submissionStats.totalStudents}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-green-600">{assignment.submissionStats.submitted}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Graded</p>
                <p className="text-2xl font-bold text-purple-600">{assignment.submissionStats.graded}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-2xl font-bold text-emerald-600">{completionRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`${
                activeTab === 'students'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <Users className="w-5 h-5" />
              <span>Students ({assignment.assignedTo.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`${
                activeTab === 'submissions'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <FileText className="w-5 h-5" />
              <span>Submissions</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">
                      {assignment.dueDate 
                        ? new Date(assignment.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'No due date'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="font-medium">
                      {new Date(assignment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Total Marks</p>
                    <p className="font-medium">{assignment.totalMarks} points</p>
                  </div>
                </div>

                {assignment.uploadedFileUrl && (
                  <div className="pt-4">
                    <a
                      href={assignment.uploadedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Assignment File</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>
              
              {assignment.originalContent?.questions && assignment.originalContent.questions.length > 0 ? (
                <div className="space-y-4">
                  {assignment.originalContent.questions.map((question, index) => {
                    // Check if we have detailed question information
                    const questionDetail = assignment.originalContent?.questionDetails?.[index];
                    
                    return (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">
                              <span className="text-emerald-600 mr-2">Q{index + 1}.</span>
                              {question}
                            </p>
                          </div>
                          {questionDetail && (
                            <div className="ml-4 text-right">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {questionDetail.marks} marks
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {assignment.originalContent?.questionDetails && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Total Questions:</strong> {assignment.originalContent.questions.length} | 
                        <strong> Total Marks:</strong> {assignment.originalContent.questionDetails.reduce((sum: number, q: any) => sum + q.marks, 0)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No questions available</p>
              )}
            </div>

            {/* Grade Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Show Marks to Students</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    assignment.gradeSettings?.showMarksToStudents 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {assignment.gradeSettings?.showMarksToStudents ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Show Feedback to Students</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    assignment.gradeSettings?.showFeedbackToStudents 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {assignment.gradeSettings?.showFeedbackToStudents ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Personalization Info */}
            {assignment.personalizedVersions && assignment.personalizedVersions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalization</h3>
                <p className="text-sm text-gray-600 mb-3">
                  This assignment has been personalized for {assignment.personalizedVersions.length} student(s) based on their OCEAN personality traits and learning preferences.
                </p>
                <div className="flex items-center space-x-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">AI Personalization Enabled</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assigned Students</h3>
            </div>
            
            {assignment.personalizedVersions && assignment.personalizedVersions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {assignment.personalizedVersions.map((version, index) => (
                  <div key={version.studentMockId} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {version.studentName || version.studentMockId.replace(/_/g, ' ').replace(/student/i, 'Student ').replace(/gmail|com/g, '').trim()}
                          </p>
                        </div>
                      </div>
                      
                      {version.personalizationReason && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            Personalized
                          </span>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            title={version.personalizationReason}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No student data available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Submissions</h3>
              <p className="text-gray-600">
                Submission details will be displayed here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
