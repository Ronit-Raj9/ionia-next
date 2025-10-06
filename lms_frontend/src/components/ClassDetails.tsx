"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X,
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
  FileText
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

interface ClassDetailsProps {
  classId: string;
  userId: string;
  role: string;
  onClose: () => void;
}

export default function ClassDetails({ classId, userId, role, onClose }: ClassDetailsProps) {
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedJoinCode, setCopiedJoinCode] = useState(false);

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const fetchClassDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/classes/${classId}?role=${role}&mockUserId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setClassDetails(data.data);
      } else {
        toast.error(data.error || 'Failed to load class details');
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
      toast.error('Failed to load class details');
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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return null;
  }

  const { class: classInfo, statistics, recentAssignments, recentSubmissions } = classDetails;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{classInfo.className}</h2>
              {classInfo.description && (
                <p className="text-emerald-50 mb-3">{classInfo.description}</p>
              )}
              <div className="flex items-center gap-3">
                {classInfo.subject && (
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    {classInfo.subject}
                  </span>
                )}
                {classInfo.grade && (
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    Grade {classInfo.grade}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm ${
                  classInfo.isActive 
                    ? 'bg-green-500 bg-opacity-20' 
                    : 'bg-red-500 bg-opacity-20'
                }`}>
                  {classInfo.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Join Code */}
          <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-50 text-sm mb-1">Join Code</p>
                <code className="text-xl font-mono font-bold">{classInfo.joinCode}</code>
              </div>
              <button
                onClick={() => copyJoinCode(classInfo.joinCode)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                {copiedJoinCode ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-blue-600" />
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-blue-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-blue-900">{statistics.totalStudents}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <BookOpen className="w-8 h-8 text-emerald-600" />
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-600 mb-1">Total Assignments</p>
              <p className="text-3xl font-bold text-emerald-900">{statistics.totalAssignments}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <Award className="w-8 h-8 text-purple-600" />
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-purple-600 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-purple-900">{statistics.averageScore}%</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalSubmissions}</p>
                </div>
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Graded</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.gradedSubmissions}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.completionRate}%</p>
                </div>
                <TrendingUp className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Assignments */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Recent Assignments
              </h3>
              {recentAssignments.length > 0 ? (
                <div className="space-y-3">
                  {recentAssignments.map((assignment) => (
                    <div key={assignment._id} className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                        <span>{assignment.subject}</span>
                        {assignment.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No assignments yet</p>
              )}
            </div>

            {/* Recent Submissions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Recent Submissions
              </h3>
              {recentSubmissions.length > 0 ? (
                <div className="space-y-3">
                  {recentSubmissions.map((submission) => (
                    <div key={submission._id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{submission.studentName}</p>
                        {submission.score !== undefined && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm font-medium">
                            {submission.score}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(submission.submissionTime).toLocaleDateString()}
                        </span>
                        <span className={`capitalize ${
                          submission.status === 'graded' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No submissions yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}




