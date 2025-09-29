"use client";

import React, { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Image, 
  Send, 
  BarChart3, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  taskType: string;
  originalContent: {
    questions: string[];
  };
  uploadedFileUrl?: string;
  createdAt: string;
  personalizedVersions: any[];
}

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
  studentProgress: any[];
}

export default function TeacherDashboard() {
  const { user } = useRole();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Form state
  const [questions, setQuestions] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check if user is teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.push('/');
      return;
    }
    
    if (user) {
      fetchAssignments();
      fetchProgress();
    }
  }, [user, router]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?role=${user?.role}&mockUserId=${user?.mockUserId}&classId=${user?.classId}`);
      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.data);
      } else {
        toast.error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress?role=${user?.role}&mockUserId=${user?.mockUserId}&classId=${user?.classId}`);
      const data = await response.json();
      
      if (data.success) {
        setProgressData(data.data);
      } else {
        toast.error('Failed to fetch progress data');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to fetch progress data');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload images, PDFs, or text files only');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmitAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!questions.trim() && !selectedFile) {
      toast.error('Please provide questions or upload a file');
      return;
    }

    setUploadLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('role', user?.role || '');
      formData.append('mockUserId', user?.mockUserId || '');
      formData.append('classId', user?.classId || '');
      formData.append('questions', questions);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/assignments', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Assignment created and personalized for ${data.data.personalizedCount} students!`);
        setQuestions('');
        setSelectedFile(null);
        fetchAssignments();
        fetchProgress();
      } else {
        toast.error(data.error || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setUploadLoading(false);
    }
  };

  if (!user || user.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in as a teacher to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.name || user.displayName}!
          </h1>
          <p className="text-gray-600">
            Create assignments and track your students' progress with AI-powered personalization.
          </p>
        </div>

        {/* Quick Stats */}
        {progressData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{progressData.classMetrics.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{progressData.classMetrics.averageScore}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{progressData.classMetrics.totalSubmissions}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Time Saved</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.floor(progressData.classMetrics.totalTimeSaved / 60)}h</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignment Creation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Assignment</h2>
              
              <form onSubmit={handleSubmitAssignment} className="space-y-6">
                {/* Questions Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Math Questions (one per line)
                  </label>
                  <textarea
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    placeholder="Enter math questions, one per line:&#10;1. Solve for x: 2x + 5 = 13&#10;2. Calculate the area of a rectangle with length 8cm and width 5cm&#10;3. Simplify: 3/4 + 1/8"
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    rows={6}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Upload Assignment File
                  </label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors duration-200 bg-gray-50 hover:bg-emerald-50">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept="image/*,.pdf,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Images, PDFs, or text files (max 10MB)
                      </p>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploadLoading || (!questions.trim() && !selectedFile)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {uploadLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating & Personalizing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Create Assignment
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Class Weaknesses Heatmap */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Class Weaknesses</h2>
              
              {progressData && progressData.heatmap.length > 0 ? (
                <div className="space-y-3">
                  {progressData.heatmap.slice(0, 6).map((item, index) => (
                    <div key={item.topic} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.topic.replace('-', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.percentage > 60 ? 'bg-red-500' :
                              item.percentage > 30 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-10 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No data available yet. Create assignments to see class weaknesses.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Assignments</h2>
            
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            Math Assignment
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(assignment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {assignment.originalContent.questions.slice(0, 2).map((q, i) => (
                            <div key={i}>• {q}</div>
                          ))}
                          {assignment.originalContent.questions.length > 2 && (
                            <div>... and {assignment.originalContent.questions.length - 2} more</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{assignment.personalizedVersions.length} personalized</span>
                        </div>
                        {assignment.uploadedFileUrl && (
                          <div className="flex items-center space-x-1 text-sm text-blue-600 mt-1">
                            <Image className="w-4 h-4" />
                            <span>File attached</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assignments created yet.</p>
                <p className="text-sm text-gray-400">Create your first assignment above to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
