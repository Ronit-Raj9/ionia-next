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
  BookOpen,
  ClipboardCheck,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import GradingInterface from '@/components/GradingInterface';
import StudentSelector from '@/components/StudentSelector';
import TeacherInbox from '@/components/TeacherInbox';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import ClassroomManager from '@/components/ClassroomManager';
import { getUserDisplayName, getUserId } from '@/lib/userUtils';

interface Assignment {
  _id: string;
  title: string;
  subject: string;
  taskType: string;
  originalContent: {
    questions: string[];
  };
  uploadedFileUrl?: string;
  createdAt: string;
  personalizedVersions: any[];
  suggestions?: {
    recommendedTask: string;
    basedOn: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number;
  }[];
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
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Math');
  const [difficulty, setDifficulty] = useState('medium');
  const [totalMarks, setTotalMarks] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [showMarksToStudents, setShowMarksToStudents] = useState(false);
  const [showFeedbackToStudents, setShowFeedbackToStudents] = useState(true);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  
  // Phase 2 state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'grading' | 'analytics' | 'inbox' | 'classrooms'>('overview');

  // Check if user is teacher
  useEffect(() => {
    if (user && user.role !== 'teacher') {
      router.push('/');
      return;
    }
    
    if (user) {
      fetchAssignments();
      fetchProgress();
      fetchEnhancedDashboardData();
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

  const fetchEnhancedDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?role=${user?.role}&mockUserId=${user?.mockUserId}&classId=${user?.classId}&schoolId=${user?.schoolId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
        setAiSuggestions(data.data.suggestions || []);
      } else {
        console.error('Failed to fetch enhanced dashboard data');
      }
    } catch (error) {
      console.error('Error fetching enhanced dashboard data:', error);
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
      formData.append('title', assignmentTitle);
      formData.append('description', description);
      formData.append('subject', subject);
      formData.append('difficulty', difficulty);
      formData.append('totalMarks', totalMarks.toString());
      formData.append('showMarksToStudents', showMarksToStudents.toString());
      formData.append('showFeedbackToStudents', showFeedbackToStudents.toString());
      formData.append('assignedStudents', JSON.stringify(selectedStudents.map(s => s.id)));
      
      if (dueDate) {
        formData.append('dueDate', dueDate);
      }
      
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
        setAssignmentTitle('');
        setDescription('');
        setSubject('Math');
        setDifficulty('medium');
        setTotalMarks(100);
        setDueDate('');
        setShowMarksToStudents(false);
        setShowFeedbackToStudents(true);
        setSelectedStudents([]);
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
          
          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="w-4 h-4 inline mr-2" />
                Create Assignment
              </button>
              <button
                onClick={() => setActiveTab('grading')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'grading'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClipboardCheck className="w-4 h-4 inline mr-2" />
                Grading Center
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('classrooms')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'classrooms'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Classrooms
              </button>
              <button
                onClick={() => setActiveTab('inbox')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inbox'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Student Messages
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
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

            {/* Recent Assignments */}
            <div className="mt-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Assignments</h2>
                
                {assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.map((assignment: any) => (
                      <div key={assignment._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 bg-white cursor-pointer" onClick={() => router.push(`/teacher/assignment/${assignment._id}`)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-5 h-5 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                {assignment.title || 'Untitled Assignment'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(assignment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {assignment.originalContent.questions.slice(0, 2).map((q: string, i: number) => (
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
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No assignments created yet.</p>
                    <p className="text-sm text-gray-400">Create your first assignment to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Create Assignment Tab */}
        {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignment Creation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Assignment</h2>
              
              <form onSubmit={handleSubmitAssignment} className="space-y-6">
                  {/* Assignment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        placeholder="e.g., Algebra Practice Quiz"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="Math">Math</option>
                        <option value="Science">Science</option>
                        <option value="English">English</option>
                        <option value="History">History</option>
                        <option value="General">General</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total Marks
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalMarks}
                        onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the assignment..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Grade Settings */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Grade Visibility Settings</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={showMarksToStudents}
                          onChange={(e) => setShowMarksToStudents(e.target.checked)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show marks to students immediately</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={showFeedbackToStudents}
                          onChange={(e) => setShowFeedbackToStudents(e.target.checked)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Show feedback to students immediately</span>
                      </label>
                    </div>
                  </div>

                  {/* Student Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign to Students
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4">
                      {selectedStudents.length > 0 ? (
                        <div className="space-y-3">
                          {selectedStudents.length >= 20 ? (
                            <div className="flex items-center space-x-2 text-emerald-600">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">Entire Class Selected</p>
                                <p className="text-xs text-gray-500">All {selectedStudents.length} students will receive this assignment</p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">
                                Selected {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}:
                              </p>
                              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                {selectedStudents.map((student) => (
                                  <span
                                    key={student.id}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                                  >
                                    {student.name}
                                    <button
                                      onClick={() => setSelectedStudents(prev => prev.filter(s => s.id !== student.id))}
                                      className="ml-2 text-emerald-600 hover:text-emerald-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => setShowStudentSelector(true)}
                              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              + Modify selection
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedStudents([])}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Clear all
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            No students selected. Assignment will be sent to all students in the class.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowStudentSelector(true)}
                            className="inline-flex items-center px-4 py-2 border border-emerald-300 text-sm font-medium rounded-md text-emerald-700 bg-white hover:bg-emerald-50 transition-colors"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Select Students
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                {/* Questions Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Questions (one per line)
                  </label>
                  <textarea
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                      placeholder="Enter questions, one per line:&#10;1. Solve for x: 2x + 5 = 13&#10;2. Calculate the area of a rectangle with length 8cm and width 5cm&#10;3. Simplify: 3/4 + 1/8"
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

        {/* AI-Powered Assignment Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="mt-8">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">AI Assignment Suggestions</h2>
                </div>
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  {showSuggestions ? 'Hide' : 'Show'} Suggestions
                </button>
              </div>
              
              {showSuggestions && (
                <div className="space-y-4">
                  {aiSuggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg p-4 border border-emerald-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {suggestion.recommendedTask}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Based on: {suggestion.basedOn}
                          </p>
                          <div className="flex items-center space-x-4 text-xs">
                            <span className={`px-2 py-1 rounded-full ${
                              suggestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              suggestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {suggestion.difficulty.toUpperCase()}
                            </span>
                            <span className="text-gray-500">
                              ⏱️ {suggestion.estimatedTime} min
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setQuestions(suggestion.recommendedTask);
                            toast.success('Suggestion added to assignment form!');
                          }}
                          className="ml-4 px-3 py-1 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          Use This
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                <p className="text-sm text-emerald-700">
                  💡 These suggestions are generated based on your class's learning patterns and weaknesses. 
                  Click "Use This" to automatically fill the assignment form.
                </p>
              </div>
            </div>
          </div>
                          )}
                        </div>
                          </div>
                        )}

        {/* Grading Tab */}
        {activeTab === 'grading' && (
          <div className="h-screen">
            <GradingInterface
              teacherId={user?.mockUserId || ''}
              teacherName={user?.name || user?.displayName || 'Teacher'}
              onGradeSubmitted={() => {
                toast.success('Grade updated successfully!');
              }}
            />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            <AdvancedAnalytics
              studentId="class-overview"
              isParentView={false}
              onExportReport={(data) => {
                console.log('Analytics report exported:', data);
                toast.success('Analytics report exported successfully!');
              }}
            />
          </div>
        )}

        {/* Classrooms Tab */}
        {activeTab === 'classrooms' && (
          <div className="space-y-6">
            {!user?.mockUserId || !user?.schoolId ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p className="text-yellow-800 mb-4">
                  ⚠️ Please log out and log back in to access classrooms.
                  Your user data needs to be refreshed.
                </p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <ClassroomManager
                userId={getUserId(user) || user.mockUserId}
                userName={getUserDisplayName(user)}
                role="teacher"
                schoolId={user.schoolId}
              />
            )}
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="h-screen">
            <TeacherInbox
              teacherId={user?.mockUserId || ''}
              teacherName={user?.name || user?.displayName || 'Teacher'}
              isEmbedded={true}
            />
          </div>
        )}

        {/* Student Selector Modal */}
        {showStudentSelector && (
            <StudentSelector
              onStudentsSelected={(students, selectedClass) => {
                setSelectedStudents(students.filter(s => s.isSelected));
                setShowStudentSelector(false);
                if (selectedClass) {
                  toast.success(`Selected ${students.length} students from ${selectedClass.className}`);
                }
              }}
              onClose={() => setShowStudentSelector(false)}
              classId={user?.classId || 'default-class'}
              teacherId={user?.mockUserId || ''}
              teacherRole={user?.role || 'teacher'}
            />
        )}
      </div>
    </div>
  );
}
