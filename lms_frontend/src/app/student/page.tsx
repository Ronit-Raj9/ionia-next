"use client";

import React, { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Camera, 
  FileText, 
  Send, 
  CheckCircle, 
  Clock,
  Star,
  TrendingUp,
  AlertCircle,
  Upload,
  Eye,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  taskType: string;
  createdAt: string;
  uploadedFileUrl?: string;
  questions: string[];
  variations: string;
  originalQuestions: string[];
}

interface Submission {
  _id: string;
  assignmentId: string;
  submissionTime: string;
  grade: {
    score: number;
    feedback: string;
    errors: string[];
  };
  processed: boolean;
}

interface StudentProgress {
  metrics: {
    totalSubmissions: number;
    averageScore: number;
    completionRate: number;
    weaknesses: string[];
    strengths: string[];
    masteryScores: Record<string, number>;
    timeSaved: number;
  };
  recentActivity: {
    date: string;
    score: number;
    feedback: string;
  }[];
}

export default function StudentDashboard() {
  const { user } = useRole();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Form state
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Check if user is student
  useEffect(() => {
    if (user && user.role !== 'student') {
      router.push('/');
      return;
    }
    
    if (user) {
      fetchAssignments();
      fetchSubmissions();
      fetchProgress();
    }
  }, [user, router]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?role=${user?.role}&mockUserId=${user?.mockUserId}&classId=${user?.classId}&studentMockId=${user?.mockUserId}`);
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

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/submissions?role=${user?.role}&mockUserId=${user?.mockUserId}`);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.data);
      } else {
        toast.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress?role=${user?.role}&mockUserId=${user?.mockUserId}&classId=${user?.classId}`);
      const data = await response.json();
      
      if (data.success) {
        setProgress(data.data);
      } else {
        toast.error('Failed to fetch progress data');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to fetch progress data');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported image format`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(validFiles);
  };

  const handleSubmitAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedAssignment) {
      toast.error('Please select an assignment');
      return;
    }
    
    if (!textAnswer.trim() && selectedFiles.length === 0) {
      toast.error('Please provide an answer or upload images');
      return;
    }

    setSubmitLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('role', user?.role || '');
      formData.append('studentMockId', user?.mockUserId || '');
      formData.append('assignmentId', selectedAssignment._id);
      formData.append('textAnswer', textAnswer);
      
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Answer submitted! Score: ${data.data.grade.score}%`);
        setTextAnswer('');
        setSelectedFiles([]);
        setSelectedAssignment(null);
        fetchSubmissions();
        fetchProgress();
      } else {
        toast.error(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(sub => sub.assignmentId === assignmentId);
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need to be logged in as a student to access this page.</p>
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
            Complete your personalized assignments and track your learning progress.
          </p>
        </div>

        {/* Progress Stats */}
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assignments Done</p>
                  <p className="text-2xl font-bold text-gray-900">{progress.metrics.totalSubmissions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{progress.metrics.averageScore}%</p>
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
                  <p className="text-2xl font-bold text-gray-900">{progress.metrics.completionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Learning Streak</p>
                  <p className="text-2xl font-bold text-gray-900">7 days</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Assignments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Assignments</h2>
              
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const submission = getSubmissionForAssignment(assignment._id);
                    const isCompleted = submission && submission.processed;
                    
                    return (
                      <div 
                        key={assignment._id} 
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                          selectedAssignment?._id === assignment._id 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : isCompleted 
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                        onClick={() => !isCompleted && setSelectedAssignment(assignment)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <BookOpen className="w-5 h-5 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                Math Assignment
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(assignment.createdAt).toLocaleDateString()}
                              </span>
                              {isCompleted && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            
                            {/* Personalized Questions */}
                            <div className="text-sm text-gray-700 mb-2">
                              <p className="font-medium text-emerald-600 mb-1">
                                Personalized for you: {assignment.variations}
                              </p>
                              {assignment.questions.slice(0, 2).map((q, i) => (
                                <div key={i} className="mb-1">• {q}</div>
                              ))}
                              {assignment.questions.length > 2 && (
                                <div className="text-gray-500">
                                  ... and {assignment.questions.length - 2} more questions
                                </div>
                              )}
                            </div>
                            
                            {assignment.uploadedFileUrl && (
                              <div className="flex items-center space-x-1 text-sm text-blue-600">
                                <FileText className="w-4 h-4" />
                                <span>Reference file attached</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            {isCompleted ? (
                              <div className="text-green-600">
                                <div className="font-bold text-lg">{submission.grade.score}%</div>
                                <div className="text-sm">Completed</div>
                              </div>
                            ) : (
                              <div className="text-emerald-600">
                                <div className="text-sm font-medium">Click to start</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No assignments available yet.</p>
                  <p className="text-sm text-gray-400">Check back later for new assignments from your teacher!</p>
                </div>
              )}
            </div>

            {/* Answer Submission Form */}
            {selectedAssignment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Submit Your Answer
                </h3>
                
                <form onSubmit={handleSubmitAnswer} className="space-y-6">
                  {/* Text Answer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Written Answer
                    </label>
                    <textarea
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      placeholder="Type your answers here... Show your work step by step."
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      rows={6}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Photos of Your Work
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors duration-200">
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*"
                        multiple
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {selectedFiles.length > 0 
                            ? `${selectedFiles.length} image(s) selected` 
                            : 'Click to upload photos of your handwritten work'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Images only (max 10MB each)
                        </p>
                      </label>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                            {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={submitLoading || (!textAnswer.trim() && selectedFiles.length === 0)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      {submitLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Grading...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Answer
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedAssignment(null)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Progress & Recent Activity */}
          <div className="space-y-6">
            {/* Strengths & Weaknesses */}
            {progress && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Learning Profile</h3>
                
                {progress.metrics.strengths.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                    <div className="flex flex-wrap gap-2">
                      {progress.metrics.strengths.map((strength) => (
                        <span key={strength} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {progress.metrics.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-700 mb-2">Areas to Improve</h4>
                    <div className="flex flex-wrap gap-2">
                      {progress.metrics.weaknesses.map((weakness) => (
                        <span key={weakness} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          {weakness.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              {progress && progress.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {progress.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Assignment Completed</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          activity.score >= 80 ? 'text-green-600' :
                          activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {activity.score}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No activity yet. Complete assignments to see your progress!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
