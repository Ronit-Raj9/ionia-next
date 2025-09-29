"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck,
  Eye,
  EyeOff,
  Star,
  Clock,
  User,
  FileText,
  Save,
  Send,
  CheckCircle,
  AlertCircle,
  Book,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Submission {
  _id: string;
  assignmentId: string;
  studentMockId: string;
  studentName: string;
  submittedContent: {
    text: string;
    imageUrls: string[];
    attachments?: {
      type: 'image' | 'document';
      url: string;
      fileName: string;
      fileSize: number;
    }[];
  };
  submissionTime: Date;
  grade?: {
    score: number;
    maxScore: number;
    feedback: string;
    gradedBy: string;
    gradedAt: Date;
    isPublished: boolean;
  };
  status: 'submitted' | 'graded' | 'returned';
  assignmentTitle: string;
  assignmentSubject: string;
  assignmentTotalMarks: number;
  assignmentDifficulty: string;
  canShowGrade: boolean;
  canShowFeedback: boolean;
}

interface GradingInterfaceProps {
  teacherId: string;
  teacherName: string;
  assignmentId?: string;
  onGradeSubmitted?: () => void;
}

export default function GradingInterface({ 
  teacherId, 
  teacherName, 
  assignmentId,
  onGradeSubmitted 
}: GradingInterfaceProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [privateComments, setPrivateComments] = useState('');
  const [publishGrade, setPublishGrade] = useState(false);

  useEffect(() => {
    fetchSubmissions();
  }, [teacherId, assignmentId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        role: 'teacher',
        teacherId
      });

      if (assignmentId) {
        params.append('assignmentId', assignmentId);
      }

      const response = await fetch(`/api/grading?${params}`);
      const data = await response.json();

      if (data.success) {
        setSubmissions(data.data);
      } else if (data.error?.includes('Database connection')) {
        toast.error('Database connection issue. Please try again later.');
        setSubmissions([]);
      } else {
        toast.error('Failed to load submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const selectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setScore(submission.grade?.score || 0);
    setFeedback(submission.grade?.feedback || '');
    setPrivateComments('');
    setPublishGrade(submission.grade?.isPublished || false);
  };

  const gradeSubmission = async (publish: boolean = false) => {
    if (!selectedSubmission) return;

    if (score > selectedSubmission.assignmentTotalMarks) {
      toast.error(`Score cannot exceed ${selectedSubmission.assignmentTotalMarks} marks`);
      return;
    }

    try {
      setGrading(true);

      const formData = new FormData();
      formData.append('role', 'teacher');
      formData.append('teacherId', teacherId);
      formData.append('submissionId', selectedSubmission._id);
      formData.append('score', score.toString());
      formData.append('maxScore', selectedSubmission.assignmentTotalMarks.toString());
      formData.append('feedback', feedback);
      formData.append('isPublished', publish.toString());
      if (privateComments) {
        formData.append('privateComments', privateComments);
      }

      const response = await fetch('/api/grading', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        await fetchSubmissions(); // Refresh the list
        if (onGradeSubmitted) {
          onGradeSubmitted();
        }
        
        // Update selected submission
        setSelectedSubmission(prev => prev ? {
          ...prev,
          grade: {
            score,
            maxScore: selectedSubmission.assignmentTotalMarks,
            feedback,
            gradedBy: teacherId,
            gradedAt: new Date(),
            isPublished: publish
          },
          status: publish ? 'returned' : 'graded'
        } : null);
      } else {
        toast.error(data.error || 'Failed to grade submission');
      }
    } catch (error) {
      console.error('Error grading submission:', error);
      toast.error('Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string, grade?: any) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'graded':
        return grade?.isPublished ? 
          <CheckCircle className="w-4 h-4 text-green-600" /> :
          <EyeOff className="w-4 h-4 text-blue-600" />;
      case 'returned':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string, grade?: any) => {
    switch (status) {
      case 'submitted':
        return 'Awaiting Grade';
      case 'graded':
        return grade?.isPublished ? 'Grade Published' : 'Grade Draft';
      case 'returned':
        return 'Graded & Returned';
      default:
        return 'Unknown';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <ClipboardCheck className="w-5 h-5 mr-2 text-emerald-600" />
            Grading Center
          </h2>
          <p className="text-sm text-gray-600">
            {assignmentId ? 'Assignment submissions' : 'All submissions'} • {submissions.length} items
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Submissions List */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          {submissions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No submissions yet</p>
                <p className="text-sm">Submissions will appear here when students submit their work</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {submissions.map((submission) => (
                <motion.div
                  key={submission._id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => selectSubmission(submission)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedSubmission?._id === submission._id
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">{submission.studentName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(submission.status, submission.grade)}
                      <span className="text-xs text-gray-500">
                        {getStatusText(submission.status, submission.grade)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <h4 className="font-medium text-gray-900 mb-1">{submission.assignmentTitle}</h4>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Book className="w-3 h-3" />
                        <span>{submission.assignmentSubject}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full ${getDifficultyColor(submission.assignmentDifficulty)}`}>
                        {submission.assignmentDifficulty}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>{submission.assignmentTotalMarks} marks</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Submitted {formatDate(submission.submissionTime)}</span>
                    </div>
                    {submission.grade && (
                      <div className="text-sm font-medium text-emerald-600">
                        {submission.grade.score}/{submission.grade.maxScore}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Grading Panel */}
        <div className="w-1/2 flex flex-col">
          {selectedSubmission ? (
            <>
              {/* Submission Details */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedSubmission.studentName}'s Submission
                  </h3>
                  <div className="text-sm text-gray-600 mb-4">
                    Assignment: {selectedSubmission.assignmentTitle} • 
                    Submitted {formatDate(selectedSubmission.submissionTime)}
                  </div>
                </div>

                {/* Submitted Content */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Student Work
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedSubmission.submittedContent.text ? (
                      <div className="whitespace-pre-wrap text-gray-700">
                        {selectedSubmission.submittedContent.text}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No text content submitted</p>
                    )}
                  </div>
                  
                  {/* Attachments */}
                  {selectedSubmission.submittedContent.attachments && 
                   selectedSubmission.submittedContent.attachments.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">Attachments</h5>
                      <div className="space-y-2">
                        {selectedSubmission.submittedContent.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                              <p className="text-xs text-gray-500">{attachment.type}</p>
                            </div>
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 text-sm"
                            >
                              View
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Grading Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Score (out of {selectedSubmission.assignmentTotalMarks})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={selectedSubmission.assignmentTotalMarks}
                      value={score}
                      onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback for Student
                    </label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback for the student..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Private Comments (Teacher Only)
                    </label>
                    <textarea
                      value={privateComments}
                      onChange={(e) => setPrivateComments(e.target.value)}
                      placeholder="Private notes not visible to student..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {selectedSubmission.canShowGrade ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600">
                        Grades {selectedSubmission.canShowGrade ? 'visible' : 'hidden'} to students
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => gradeSubmission(false)}
                      disabled={grading}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </button>
                    <button
                      onClick={() => gradeSubmission(true)}
                      disabled={grading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {grading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Publish Grade
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Select a submission to grade</p>
                <p className="text-sm">Choose a submission from the list to start grading</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
