"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  Eye,
  Calendar,
  FileText,
  Image as ImageIcon,
  Send,
  ArrowLeft,
  Award,
  TrendingUp,
  Star,
  Target,
  X,
  Download,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  grade?: string;
  topic?: string;
  difficulty: string;
  totalMarks: number;
  maxScore?: number;
  dueDate?: string;
  createdAt: string;
  canSeeGrades: boolean;
  canSeeFeedback: boolean;
  assignmentType?: string;
  questions?: string[];
  uploadedFileUrl?: string;
  // Personalized content
  difficultyAdjustment?: string;
  hints?: string[];
  visualAids?: any[];
  remedialQuestions?: string[];
  challengeQuestions?: string[];
  encouragementNote?: string;
}

interface Submission {
  _id: string;
  assignmentId: string;
  studentId: string;
  submissionTime: string;
  submittedContent: {
    text: string;
    imageUrls: string[];
  };
  grade?: {
    score: number;
    maxScore: number;
    feedback: string;
    gradedAt: Date;
    isPublished: boolean;
  };
  autoGrade?: {
    score: number;
    maxScore: number;
    overallFeedback: string;
    questionWise?: Array<{
      question: string;
      studentAnswer: string;
      score: number;
      maxScore: number;
      feedback: string;
    }>;
    errorAnalysis?: any;
    strengths?: string[];
    areasForImprovement?: string[];
  };
  status: 'submitted' | 'graded' | 'returned';
  processingStatus?: string;
}

interface StudentClassroomProps {
  classId: string;
  studentId: string;
  studentName: string;
  onBack?: () => void;
  showScoreNotifications?: boolean;
}

export default function StudentClassroom({ 
  classId, 
  studentId, 
  studentName,
  onBack,
  showScoreNotifications
}: StudentClassroomProps) {
  // Use localStorage if showScoreNotifications is not provided - Default to false (no notifications)
  const [localShowScoreNotifications, setLocalShowScoreNotifications] = useState(false);
  
  useEffect(() => {
    if (showScoreNotifications === undefined) {
      const savedPreference = localStorage.getItem('showScoreNotifications');
      if (savedPreference !== null) {
        setLocalShowScoreNotifications(JSON.parse(savedPreference));
      }
    }
  }, [showScoreNotifications]);
  
  const shouldShowScoreNotifications = showScoreNotifications !== undefined ? showScoreNotifications : localShowScoreNotifications;
  const [classDetails, setClassDetails] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Submission form state
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // View state
  const [view, setView] = useState<'assignments' | 'grades' | 'submission'>('assignments');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    if (classId && studentId) {
      fetchClassDetails();
      fetchAssignments();
      fetchSubmissions();
    }
  }, [classId, studentId]);

  useEffect(() => {
    // Cleanup preview URLs
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const fetchClassDetails = async () => {
    try {
      const response = await fetch(
        `/api/classes/${classId}?role=student&userId=${studentId}&studentId=${studentId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setClassDetails(data.data);
      } else {
        console.error('Error fetching class details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
      toast.error('Failed to load class details');
    }
  };

  const fetchAssignments = async () => {
    try {
      // Fetch all assignments for the student, then filter by classId
      const response = await fetch(
        `/api/assignments?role=student&userId=${studentId}&studentId=${studentId}&classId=${classId}`
      );
      const data = await response.json();
      
      if (data.success) {
        // Filter assignments to show only those for this specific class
        const classAssignments = data.data.filter((assignment: any) => 
          assignment.classId === classId || 
          (assignment.assignedTo && assignment.assignedTo.includes(studentId))
        );
        setAssignments(classAssignments);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(
        `/api/submissions?role=student&userId=${studentId}&studentId=${studentId}&classId=${classId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.data);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
    
    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file));
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls(urls);
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;

    if (!textAnswer.trim() && selectedFiles.length === 0) {
      toast.error('Please provide an answer (text or images)');
      return;
    }

    setSubmitLoading(true);

    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id);
      formData.append('studentId', studentId);
      formData.append('studentName', studentName);
      formData.append('classId', classId);
      formData.append('text', textAnswer);

      selectedFiles.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const response = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        if (shouldShowScoreNotifications && data.data.grade && data.data.grade.score !== undefined) {
          toast.success(`Assignment submitted! Score: ${data.data.grade.score}%`);
        } else {
          toast.success('Assignment submitted successfully!');
        }
        setTextAnswer('');
        setSelectedFiles([]);
        setPreviewUrls([]);
        setSelectedAssignment(null);
        setView('assignments');
        fetchSubmissions();
        fetchAssignments();
      } else {
        toast.error(data.error || 'Failed to submit assignment');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast.error('Failed to submit assignment');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(s => s.assignmentId === assignmentId);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const submission = getSubmissionForAssignment(assignment._id);
    
    if (filterStatus === 'pending') {
      return !submission;
    } else if (filterStatus === 'completed') {
      return !!submission;
    }
    return true;
  });

  const getStatusColor = (assignment: Assignment) => {
    const submission = getSubmissionForAssignment(assignment._id);
    
    if (!submission) return 'border-orange-300 bg-orange-50';
    if (submission.status === 'graded') return 'border-green-300 bg-green-50';
    if (submission.status === 'submitted') return 'border-blue-300 bg-blue-50';
    return 'border-gray-300 bg-gray-50';
  };

  const getStatusIcon = (assignment: Assignment) => {
    const submission = getSubmissionForAssignment(assignment._id);
    
    if (!submission) return <Clock className="w-5 h-5 text-orange-500" />;
    if (submission.status === 'graded') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (submission.status === 'submitted') return <AlertCircle className="w-5 h-5 text-blue-500" />;
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  const getStatusText = (assignment: Assignment) => {
    const submission = getSubmissionForAssignment(assignment._id);
    
    if (!submission) return 'Not Submitted';
    if (submission.status === 'graded') return 'Graded';
    if (submission.status === 'submitted') return 'Submitted';
    return 'Pending';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl p-6 text-white">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Classes
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {classDetails?.className || 'Classroom'}
            </h1>
            {classDetails?.description && (
              <p className="text-white/90 mb-3">{classDetails.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm flex-wrap">
              {classDetails?.subject && (
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {classDetails.subject}
                </span>
              )}
              {classDetails?.grade && (
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  Grade {classDetails.grade}
                </span>
              )}
              {!loading && (
                <span className="bg-white/20 px-3 py-1 rounded-full">
                  {assignments.length} {assignments.length === 1 ? 'Assignment' : 'Assignments'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('assignments')}
            className={`px-4 py-2 rounded-md transition-colors ${
              view === 'assignments'
                ? 'bg-white text-emerald-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Assignments
          </button>
          <button
            onClick={() => setView('grades')}
            className={`px-4 py-2 rounded-md transition-colors ${
              view === 'grades'
                ? 'bg-white text-emerald-600 shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-4 h-4 inline mr-2" />
            Grades
          </button>
        </div>

        {view === 'assignments' && (
          <div className="flex gap-2">
            {(['all', 'pending', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  filterStatus === status
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content based on view */}
      {view === 'assignments' && (
        <div className="space-y-4">
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => {
              const submission = getSubmissionForAssignment(assignment._id);
              
              return (
                <motion.div
                  key={assignment._id}
                  whileHover={{ scale: 1.01 }}
                  className={`border-2 rounded-lg p-5 transition-all ${getStatusColor(assignment)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(assignment)}
                        <h3 className="font-semibold text-gray-900">
                          {assignment.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          !submission ? 'bg-orange-200 text-orange-800' :
                          submission.status === 'graded' ? 'bg-green-200 text-green-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {getStatusText(assignment)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3">{assignment.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        {assignment.subject && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {assignment.subject}
                          </span>
                        )}
                        {assignment.topic && (
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {assignment.topic}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {assignment.totalMarks || assignment.maxScore || 100} marks
                        </span>
                        {assignment.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Personalized content preview */}
                      {assignment.encouragementNote && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-blue-800 italic">
                            💡 {assignment.encouragementNote}
                          </p>
                        </div>
                      )}

                      {/* Show grade if available and enabled */}
                      {submission && submission.status === 'graded' && assignment.canSeeGrades && (
                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 mb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Your Score</p>
                              <p className="text-2xl font-bold text-emerald-600">
                                {submission.autoGrade?.score || submission.grade?.score || 0} / {submission.autoGrade?.maxScore || submission.grade?.maxScore || assignment.totalMarks}
                              </p>
                            </div>
                            {submission.autoGrade && (
                              <button
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setView('submission');
                                }}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {!submission ? (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setView('submission');
                          }}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Submit
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setSelectedAssignment(assignment);
                            setView('submission');
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filterStatus === 'pending' ? 'No pending assignments' :
                 filterStatus === 'completed' ? 'No completed assignments yet' :
                 'No assignments yet'}
              </h3>
              <p className="text-gray-600">
                {filterStatus === 'pending' ? 'All caught up! Great job!' :
                 filterStatus === 'completed' ? 'Complete some assignments to see them here' :
                 'Your teacher will post assignments here'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submission View */}
      {view === 'submission' && selectedAssignment && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => {
              setView('assignments');
              setSelectedAssignment(null);
              setSelectedSubmission(null);
              setTextAnswer('');
              setSelectedFiles([]);
              setPreviewUrls([]);
            }}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Assignments
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedAssignment.title}
            </h2>
            <p className="text-gray-600">{selectedAssignment.description}</p>
          </div>

          {selectedSubmission ? (
            /* Show submission details */
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Your Submission</h3>
                
                {selectedSubmission.submittedContent.text && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Answer:</p>
                    <div className="bg-white rounded p-3 border border-gray-200">
                      {selectedSubmission.submittedContent.text}
                    </div>
                  </div>
                )}

                {selectedSubmission.submittedContent.imageUrls && selectedSubmission.submittedContent.imageUrls.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Submitted Images:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedSubmission.submittedContent.imageUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group"
                        >
                          <img
                            src={url}
                            alt={`Submission ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                            <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Show grade if available */}
              {selectedSubmission.status === 'graded' && selectedAssignment.canSeeGrades && (
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Your Score</h3>
                    <div className="text-3xl font-bold text-emerald-600">
                      {selectedSubmission.autoGrade?.score || selectedSubmission.grade?.score || 0} / {selectedSubmission.autoGrade?.maxScore || selectedSubmission.grade?.maxScore || selectedAssignment.totalMarks}
                    </div>
                  </div>

                  {selectedAssignment.canSeeFeedback && selectedSubmission.autoGrade && (
                    <div className="space-y-4 mt-6">
                      {/* Overall Feedback */}
                      {selectedSubmission.autoGrade.overallFeedback && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Overall Feedback</h4>
                          <p className="text-gray-700 bg-white rounded-lg p-3">
                            {selectedSubmission.autoGrade.overallFeedback}
                          </p>
                        </div>
                      )}

                      {/* Strengths */}
                      {selectedSubmission.autoGrade.strengths && selectedSubmission.autoGrade.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Strengths
                          </h4>
                          <ul className="space-y-2">
                            {selectedSubmission.autoGrade.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-700">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {selectedSubmission.autoGrade.areasForImprovement && selectedSubmission.autoGrade.areasForImprovement.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-500" />
                            Areas for Improvement
                          </h4>
                          <ul className="space-y-2">
                            {selectedSubmission.autoGrade.areasForImprovement.map((area, index) => (
                              <li key={index} className="flex items-start gap-2 text-gray-700">
                                <AlertCircle className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                                <span>{area}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Question-wise feedback */}
                      {selectedSubmission.autoGrade.questionWise && selectedSubmission.autoGrade.questionWise.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Question-wise Feedback</h4>
                          <div className="space-y-3">
                            {selectedSubmission.autoGrade.questionWise.map((q, index) => (
                              <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start justify-between mb-2">
                                  <p className="font-medium text-gray-900">Q{index + 1}</p>
                                  <span className="text-sm font-semibold text-emerald-600">
                                    {q.score}/{q.maxScore}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{q.feedback}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedSubmission.status === 'submitted' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Clock className="w-5 h-5" />
                    <p className="font-medium">Waiting for grading</p>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    Your teacher will grade this soon. You'll be notified when it's ready.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Submission form */
            <div className="space-y-6">
              {/* Show hints if available */}
              {selectedAssignment.hints && selectedAssignment.hints.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    💡 Hints to Help You
                  </h4>
                  <ul className="space-y-2">
                    {selectedAssignment.hints.map((hint, index) => (
                      <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                        <span className="font-medium">{index + 1}.</span>
                        <span>{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Questions */}
              {selectedAssignment.questions && selectedAssignment.questions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Questions</h3>
                  <div className="space-y-3">
                    {selectedAssignment.questions.map((question, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">
                          <span className="font-semibold mr-2">{index + 1}.</span>
                          {question}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Answer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload images (Max 5 images, 10MB each)
                    </span>
                  </label>
                </div>

                {/* Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          onClick={() => {
                            const newFiles = selectedFiles.filter((_, i) => i !== index);
                            const newUrls = previewUrls.filter((_, i) => i !== index);
                            URL.revokeObjectURL(url);
                            setSelectedFiles(newFiles);
                            setPreviewUrls(newUrls);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setView('assignments');
                    setSelectedAssignment(null);
                    setTextAnswer('');
                    setSelectedFiles([]);
                    setPreviewUrls([]);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading || (!textAnswer.trim() && selectedFiles.length === 0)}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Assignment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grades View */}
      {view === 'grades' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Grades</h2>
          
          {submissions.filter(s => s.status === 'graded').length > 0 ? (
            <div className="space-y-4">
              {submissions
                .filter(s => s.status === 'graded')
                .map((submission) => {
                  const assignment = assignments.find(a => a._id === submission.assignmentId);
                  if (!assignment) return null;
                  
                  const score = submission.autoGrade?.score || submission.grade?.score || 0;
                  const maxScore = submission.autoGrade?.maxScore || submission.grade?.maxScore || assignment.totalMarks || 100;
                  const percentage = (score / maxScore) * 100;
                  
                  return (
                    <div
                      key={submission._id}
                      className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {assignment.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Submitted: {new Date(submission.submissionTime).toLocaleDateString()}
                          </p>
                          
                          {assignment.canSeeGrades && (
                            <div className="flex items-center gap-4">
                              <div className="text-3xl font-bold text-emerald-600">
                                {score}/{maxScore}
                              </div>
                              <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                                percentage >= 80 ? 'bg-green-100 text-green-800' :
                                percentage >= 60 ? 'bg-blue-100 text-blue-800' :
                                percentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {percentage.toFixed(0)}%
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {assignment.canSeeGrades && (
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setSelectedAssignment(assignment);
                              setView('submission');
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No grades yet</h3>
              <p className="text-gray-600">
                Complete assignments to see your grades here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
