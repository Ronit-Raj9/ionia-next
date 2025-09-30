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
  Award,
  Zap,
  Target,
  Flame,
  Trophy,
  Gift,
  Users,
  MessageCircle,
  Home,
  Brain
} from 'lucide-react';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import StudentMessageTeacher from '@/components/StudentMessageTeacher';
import PersonalityQuiz from '@/components/PersonalityQuiz';
import ClassDiscovery from '@/components/ClassDiscovery';
import StudentClassroom from '@/components/StudentClassroom';
import { getUserDisplayName, getUserId } from '@/lib/userUtils';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: string;
  totalMarks: number;
  taskType: string;
  dueDate?: string;
  createdAt: string;
  uploadedFileUrl?: string;
  questions: string[];
  variations: string;
  originalQuestions: string[];
  canSeeGrades: boolean;
  canSeeFeedback: boolean;
}

interface Submission {
  _id: string;
  assignmentId: string;
  submissionTime: string;
  grade?: {
    score: number;
    maxScore: number;
    feedback: string;
    errors: string[];
    isPublished: boolean;
  };
  status: 'submitted' | 'graded' | 'returned';
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
  
  // Phase 2 gamification state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recentBadges, setRecentBadges] = useState<string[]>([]);
  const [adaptivePath, setAdaptivePath] = useState<string[]>([]);
  const [progressBars, setProgressBars] = useState<Record<string, number>>({});
  
  // Tab state and classes
  const [activeTab, setActiveTab] = useState<'assignments' | 'classes' | 'discover' | 'message'>('assignments');
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Personality quiz state
  const [showPersonalityQuiz, setShowPersonalityQuiz] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [personalityProfile, setPersonalityProfile] = useState<any>(null);
  
  // Teacher info from class
  const [teacherInfo, setTeacherInfo] = useState<{ id: string; name: string } | null>(null);

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
      fetchEnhancedDashboardData();
      fetchStudentClasses();
      checkPersonalityQuizStatus();
    }
  }, [user, router]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/assignments?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}&studentId=${user?.userId}`);
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
      const response = await fetch(`/api/submissions?role=${user?.role}&userId=${user?.userId}`);
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
      const response = await fetch(`/api/progress?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}`);
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

  const fetchEnhancedDashboardData = async () => {
    try {
      const response = await fetch(`/api/dashboard?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}&schoolId=${user?.schoolId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
        setBadges(data.data.gamification?.badges || []);
        setAdaptivePath(data.data.adaptivePath || []);
        setProgressBars(data.data.progress?.progressBars || {});
      } else {
        console.error('Failed to fetch enhanced dashboard data');
      }
    } catch (error) {
      console.error('Error fetching enhanced dashboard data:', error);
    }
  };

  const fetchStudentClasses = async () => {
    setClassesLoading(true);
    try {
      // Fetch classes where this student is a member
      const response = await fetch(`/api/classes/student?studentId=${user?.userId}&role=${user?.role}`);
      const data = await response.json();
      
      if (data.success) {
        setClasses(data.data);
        
        // Get teacher info from first class if available
        if (data.data && data.data.length > 0) {
          const firstClass = data.data[0];
          if (firstClass.teacherMockId) {
            fetchTeacherInfo(firstClass.teacherMockId);
          }
        }
      } else {
        console.error('Failed to fetch student classes:', data.error);
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching student classes:', error);
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };
  
  const fetchTeacherInfo = async (teacherId: string) => {
    try {
      // Try to get teacher from users API or extract from class data
      const usersCollection = await fetch(`/api/students`); // This returns users
      const userData = await usersCollection.json();
      
      if (userData.success) {
        // Find teacher in users data (this API might need updating to support teacher lookup)
        setTeacherInfo({ id: teacherId, name: 'Teacher' });
      }
    } catch (error) {
      console.error('Error fetching teacher info:', error);
      setTeacherInfo({ id: teacherId, name: 'Teacher' });
    }
  };

  const checkPersonalityQuizStatus = async () => {
    try {
      const response = await fetch(`/api/student-profiles?studentId=${user?.userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const hasQuiz = data.data.personalityProfile?.completedAt;
        setHasCompletedQuiz(!!hasQuiz);
        setPersonalityProfile(data.data.personalityProfile);
      } else {
        setHasCompletedQuiz(false);
      }
    } catch (error) {
      console.error('Error checking personality quiz status:', error);
      setHasCompletedQuiz(false);
    }
  };

  const handleQuizComplete = (result: any) => {
    setHasCompletedQuiz(true);
    setPersonalityProfile(result);
    setShowPersonalityQuiz(false);
    toast.success('Your learning profile has been created! Assignments will now be personalized for you.');
    
    // Refresh data to get personalized assignments
    fetchAssignments();
    fetchEnhancedDashboardData();
  };

  const handleSkipQuiz = () => {
    setShowPersonalityQuiz(false);
    toast('You can complete the personality quiz later from your profile settings.');
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
      formData.append('studentId', user?.userId || '');
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
        const score = data.data.grade.score;
        toast.success(`Answer submitted! Score: ${score}%`);
        
        // Handle gamification results
        if (data.data.gamification && data.data.gamification.newBadges.length > 0) {
          setRecentBadges(data.data.gamification.newBadges);
          setShowConfetti(true);
          
          // Show badge notifications
          data.data.gamification.notifications.forEach((notification: string, index: number) => {
            setTimeout(() => {
              toast.success(notification, { duration: 4000 });
            }, index * 1000);
          });
          
          // Hide confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 5000);
        }
        
        setTextAnswer('');
        setSelectedFiles([]);
        setSelectedAssignment(null);
        fetchSubmissions();
        fetchProgress();
        fetchEnhancedDashboardData(); // Refresh gamification data
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

  // Show personality quiz if not completed
  if (showPersonalityQuiz) {
    return (
      <PersonalityQuiz
        studentId={getUserId(user) || ''}
        onComplete={handleQuizComplete}
        onSkip={handleSkipQuiz}
        isEmbedded={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      {/* Confetti for badge achievements */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {getUserDisplayName(user)}!
          </h1>
          <p className="text-gray-600">
            Complete your personalized assignments and track your learning progress.
          </p>
          
          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'assignments'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'classes'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                My Classes
                {classes.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-emerald-100 bg-emerald-600 rounded-full">
                    {classes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('discover')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'discover'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                Discover Classes
              </button>
              <button
                onClick={() => setActiveTab('message')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'message'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Message Teacher
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Tab Content */}
        {activeTab === 'assignments' && (
          <>
            {/* Personality Quiz Prompt */}
            {!hasCompletedQuiz && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Brain className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Complete Your Learning Profile
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Take a quick 5-question quiz to get personalized assignments tailored to your learning style!
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPersonalityQuiz(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Brain className="w-4 h-4" />
                      <span>Start Quiz</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Learning Profile Display */}
            {hasCompletedQuiz && personalityProfile && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {personalityProfile.learningStyle?.charAt(0).toUpperCase() + personalityProfile.learningStyle?.slice(1)} Learner
                        </h3>
                        <p className="text-sm text-gray-600">
                          Your assignments are personalized based on your learning style
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPersonalityQuiz(true)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      Update Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Stats */}
            {progress && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Assignments Done</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{progress.metrics.totalSubmissions}</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{progress.metrics.averageScore}%</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{progress.metrics.completionRate}%</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Learning Streak</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">7 days</p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gamification Section */}
        {badges.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Trophy className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your Achievements</h2>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-medium">
                  {badges.length} Badge{badges.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {badges.map((badge, index) => (
                  <motion.div
                    key={badge.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-lg p-4 text-center border-2 ${
                      recentBadges.includes(badge.key) 
                        ? 'border-yellow-300 shadow-lg animate-pulse' 
                        : 'border-gray-100'
                    }`}
                  >
                    <div className="text-2xl mb-2">{badge.icon}</div>
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{badge.name}</h3>
                    <p className="text-xs text-gray-600">{badge.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bars */}
        {Object.keys(progressBars).length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Target className="w-6 h-6 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">Learning Progress</h2>
              </div>
              
              <div className="space-y-4">
                {Object.entries(progressBars).map(([topic, percentage]) => (
                  <div key={topic} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {topic.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-3 rounded-full ${
                          percentage >= 80 ? 'bg-green-500' :
                          percentage >= 60 ? 'bg-yellow-500' :
                          percentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Adaptive Learning Path */}
        {adaptivePath.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Zap className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your Learning Journey</h2>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {adaptivePath.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${
                      index === 0 ? 'bg-blue-500 text-white border-blue-500' :
                      index === 1 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{index + 1}</span>
                    <span className="text-sm">{step}</span>
                    {index < adaptivePath.length - 1 && (
                      <span className="text-gray-400">→</span>
                    )}
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-700">
                  🎯 Your personalized learning path adapts based on your performance and learning style!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Available Assignments */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 md:mb-6">Available Assignments</h2>
              
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const submission = getSubmissionForAssignment(assignment._id);
                    const isCompleted = submission && submission.processed;
                    
                    return (
                      <div 
                        key={assignment._id} 
                        className={`border-2 rounded-lg p-3 md:p-4 cursor-pointer transition-all duration-200 ${
                          selectedAssignment?._id === assignment._id 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : isCompleted 
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                        onClick={() => !isCompleted && setSelectedAssignment(assignment)}
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-3 md:space-y-0">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                              <div className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                                <span className="font-medium text-gray-900 text-sm md:text-base">
                                  {assignment.title || 'Math Assignment'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs md:text-sm text-gray-500">
                                  {new Date(assignment.createdAt).toLocaleDateString()}
                                </span>
                                {assignment.subject && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                    {assignment.subject}
                                  </span>
                                )}
                                {assignment.difficulty && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    assignment.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                    assignment.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {assignment.difficulty}
                                  </span>
                                )}
                                {isCompleted && (
                                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                                )}
                              </div>
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
                                {submission.grade && assignment.canSeeGrades && submission.grade.isPublished ? (
                                  <div className="font-bold text-lg">
                                    {submission.grade.score}/{submission.grade.maxScore || assignment.totalMarks}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500">Graded</div>
                                )}
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mt-4 md:mt-6">
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
          </>
        )}

        {/* Classes Tab Content */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            {selectedClassId ? (
              /* Show detailed classroom view */
              <StudentClassroom
                classId={selectedClassId}
                studentId={user?.userId || ''}
                studentName={user?.name || user?.displayName || 'Student'}
                onBack={() => setSelectedClassId(null)}
              />
            ) : (
              /* Show classes grid */
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl font-semibold text-gray-900">My Classes</h2>
                  </div>
                  <div className="text-sm text-gray-500">
                    {classes.length} class{classes.length !== 1 ? 'es' : ''} joined
                  </div>
                </div>

                {classesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : classes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((classData) => (
                      <motion.div
                        key={classData._id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-all"
                        onClick={() => {
                          setSelectedClassId(classData._id);
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {classData.className}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Teacher: {classData.teacherMockId.replace('teacher', 'Teacher ')}
                            </p>
                          </div>
                          {classData.hasUnreadMessages && (
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-gray-700">
                              {classData.studentCount} students
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">
                              {classData.recentAssignments || 0} assignments
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <span>Joined {new Date(classData.createdAt).toLocaleDateString()}</span>
                          {classData.hasUnreadMessages && (
                            <span className="text-emerald-600 font-medium">New messages</span>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClassId(classData._id);
                            }}
                            className="flex-1 px-3 py-2 bg-emerald-500 text-white text-sm font-medium rounded-md hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Class</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('message');
                            }}
                            className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                            title="Message teacher"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Yet</h3>
                    <p className="text-gray-600 mb-4">
                      You haven't joined any classes yet. Ask your teacher to add you to a class.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Tip:</strong> Once your teacher creates a class and adds you, 
                        you'll be able to see class discussions, get personalized assignments, 
                        and chat with your teacher privately.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Discover Classes Tab Content */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            <ClassDiscovery
              studentId={user.userId || ''}
              schoolId={user.schoolId || 'demo-school'}
              onClassJoined={(classId) => {
                console.log('Joined class:', classId);
                // Refresh the classes list
                fetchStudentClasses();
                // Switch to My Classes tab
                setActiveTab('classes');
              }}
            />
          </div>
        )}

        {/* Message Teacher Tab Content */}
        {activeTab === 'message' && (
          <div className="space-y-6">
            <div className="h-96">
              {teacherInfo ? (
                <StudentMessageTeacher
                  studentId={getUserId(user) || ''}
                  studentName={getUserDisplayName(user)}
                  teacherId={teacherInfo.id}
                  teacherName={teacherInfo.name}
                  isEmbedded={true}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center p-8">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No teacher assigned</p>
                    <p className="text-sm text-gray-500">Please join a class to message your teacher</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
