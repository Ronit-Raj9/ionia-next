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
  TrendingUp,
  AlertCircle,
  Eye,
  Award,
  Zap,
  Target,
  Trophy,
  Users,
  MessageCircle,
  Home,
  Brain,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import StudentMessageTeacher from '@/components/StudentMessageTeacher';
import PersonalityQuiz from '@/components/PersonalityQuiz';
import ClassDiscovery from '@/components/ClassDiscovery';
import StudentClassroom from '@/components/StudentClassroom';
import LearningAssessmentQuiz from '@/components/LearningAssessmentQuiz';
import StudentAssignmentView from '@/components/StudentAssignmentView';
import JoinClassroom from '@/components/JoinClassroom';
import ClassChat from '@/components/ClassChat';

// Import types from the new system
import { Assignment, Submission, Progress } from '@/lib/db';

export default function StudentDashboard() {
  const { user } = useRole();
  const router = useRouter();
  
  // Core data state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Form state
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Gamification state
  const [badges, setBadges] = useState<any[]>([]);
  const [progressBars, setProgressBars] = useState<Record<string, number>>({});
  const [adaptivePath, setAdaptivePath] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [recentBadges, setRecentBadges] = useState<string[]>([]);
  
  // Tab state and classes
  const [activeTab, setActiveTab] = useState<'assignments' | 'classes' | 'discover' | 'message' | 'settings' | 'adaptive-assignments' | 'class-chat'>('assignments');
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // Personality quiz state
  const [showPersonalityQuiz, setShowPersonalityQuiz] = useState(false);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [personalityProfile, setPersonalityProfile] = useState<any>(null);
  
  // Notification preferences - Default to false (no notifications)
  const [showScoreNotifications, setShowScoreNotifications] = useState(false);

  // Load notification preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('showScoreNotifications');
    if (savedPreference !== null) {
      setShowScoreNotifications(JSON.parse(savedPreference));
    }
  }, []);

  // Save notification preference to localStorage
  const handleNotificationToggle = (enabled: boolean) => {
    setShowScoreNotifications(enabled);
    localStorage.setItem('showScoreNotifications', JSON.stringify(enabled));
  };

  // Check if user is student
  useEffect(() => {
    if (user && user.role !== 'student') {
      router.push('/');
      return;
    }
    
    if (user) {
      console.log('🔍 Student dashboard mounted with user:', user);
      fetchAssignments();
      fetchSubmissions();
      fetchProgress();
      fetchStudentClasses();
      checkPersonalityQuizStatus();
    } else {
      console.log('❌ No user data available for student dashboard');
    }
  }, [user, router]);

  // Auto-refresh student data every 30 seconds
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const interval = setInterval(() => {
      fetchAssignments();
      fetchSubmissions();
      fetchProgress();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const fetchAssignments = async () => {
    try {
      // Debug student user data
      console.log('🔍 Student user data:', {
        userId: user?.userId,
        classId: user?.classId,
        role: user?.role
      });
      
      // Skip assignment fetching if student has no valid classId
      if (!user?.classId || user.classId === 'default-class') {
        console.log('⚠️ Skipping assignment fetch - no valid classId');
        setAssignments([]);
        return;
      }
      
      // Fetch assignments for all classes the student is enrolled in
      const url = `/api/assignments?role=${user?.role}&userId=${user?.userId}&studentId=${user?.userId}&classId=${user.classId}`;
      console.log('🔍 Student fetching assignments from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Student assignments response:', data);
      
      if (data.success) {
        setAssignments(data.data);
        console.log(`✅ Loaded ${data.data.length} assignments for student`);
        
        // Debug: Log each assignment found
        if (data.data.length > 0) {
          console.log('📋 Assignments found:', data.data.map((a: any) => ({
            id: a._id,
            title: a.title,
            classId: a.classId,
            assignedTo: a.assignedTo
          })));
        } else {
          console.log('❌ No assignments found for student');
        }
      } else {
        console.error('❌ Failed to fetch assignments:', data.error);
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
      // Only fetch progress if we have a valid classId (not 'default-class')
      if (!user?.classId || user.classId === 'default-class') {
        console.log('⚠️ Skipping progress fetch - no valid classId');
        return;
      }
      
      const response = await fetch(`/api/progress?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}`);
      const data = await response.json();
      
      if (data.success) {
        setProgress(data.data);
        // Extract gamification data from progress
        if (data.data.gamificationData) {
          setBadges(data.data.gamificationData.badges || []);
          setProgressBars(data.data.gamificationData.progressBars || {});
        }
      } else {
        console.error('Failed to fetch progress:', data.error);
        toast.error('Failed to fetch progress data');
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error('Failed to fetch progress data');
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
      formData.append('assignmentId', String(selectedAssignment._id || ''));
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
        const score = data.data.autoGrade?.score || 0;
        const canSeeGrades = (selectedAssignment as any)?.canSeeGrades || false;
        
        if (showScoreNotifications && canSeeGrades) {
          toast.success(`Answer submitted! Score: ${score}%`);
        } else {
          toast.success('Answer submitted successfully!');
        }
        
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
        studentId={user?.userId || ''}
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
            Welcome, {user?.name || user?.displayName || 'Student'}!
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
                onClick={() => setActiveTab('adaptive-assignments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'adaptive-assignments'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-2" />
                Adaptive Assignments
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
              <button
                onClick={() => setActiveTab('class-chat')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'class-chat'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Class Chat
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
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
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-xl border border-emerald-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Brain className="w-6 h-6 text-emerald-600" />
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
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
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
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{progress.metrics.totalSubmissions || 0}</p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm font-medium text-gray-600">Average Score</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{progress.metrics.averageScore || 0}%</p>
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
                      <p className="text-xl md:text-2xl font-bold text-gray-900">{progress.metrics.completionRate || 0}%</p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
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
                <div className="bg-gradient-to-r from-emerald-50 to-pink-50 rounded-xl border border-emerald-200 p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Trophy className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Your Achievements</h2>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-sm font-medium">
                      {badges.length} Badge{badges.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {badges.map((badge: any, index: number) => (
                      <motion.div
                        key={badge.key || index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white rounded-lg p-4 text-center border-2 ${
                          recentBadges.includes(badge.key) 
                            ? 'border-yellow-300 shadow-lg animate-pulse' 
                            : 'border-gray-100'
                        }`}
                      >
                        <div className="text-2xl mb-2">{badge.icon || '🏆'}</div>
                        <h3 className="font-medium text-gray-900 text-sm mb-1">{badge.name || 'Badge'}</h3>
                        <p className="text-xs text-gray-600">{badge.description || 'Achievement'}</p>
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
                          <span className="text-sm text-gray-600">{Math.round(percentage as number)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-3 rounded-full ${
                              (percentage as number) >= 80 ? 'bg-green-500' :
                              (percentage as number) >= 60 ? 'bg-yellow-500' :
                              (percentage as number) >= 40 ? 'bg-orange-500' : 'bg-red-500'
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
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-xl border border-emerald-200 p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Zap className="w-6 h-6 text-emerald-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Your Learning Journey</h2>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {adaptivePath.map((step: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${
                          index === 0 ? 'bg-emerald-500 text-white border-emerald-500' :
                          index === 1 ? 'bg-emerald-100 text-emerald-700 border-blue-300' :
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
                  
                  <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                    <p className="text-sm text-emerald-700">
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
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">Available Assignments</h2>
                    <button
                      onClick={() => {
                        fetchAssignments();
                        fetchSubmissions();
                        fetchProgress();
                        toast.success('Assignments refreshed');
                      }}
                      className="flex items-center space-x-2 px-3 py-1 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </button>
                  </div>
                  
                  {assignments.length > 0 ? (
                    <div className="space-y-4">
                      {assignments.map((assignment) => {
                        const assignmentId = assignment._id?.toString() || '';
                        const submission = getSubmissionForAssignment(assignmentId);
                        const isCompleted = submission && submission.processed;
                        
                        return (
                          <div 
                            key={assignmentId} 
                            className={`border-2 rounded-lg p-3 md:p-4 cursor-pointer transition-all duration-200 ${
                              selectedAssignment?._id?.toString() === assignmentId 
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
                                      {assignment.title || 'Assignment'}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs md:text-sm text-gray-500">
                                      {new Date(assignment.createdAt).toLocaleDateString()}
                                    </span>
                                    {assignment.subject && (
                                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
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
                                
                                {/* Assignment Description */}
                                <div className="text-sm text-gray-700 mb-2">
                                  <p>{assignment.description}</p>
                                </div>
                                
                                {assignment.uploadedFileUrl && (
                                  <div className="flex items-center space-x-1 text-sm text-emerald-600">
                                    <FileText className="w-4 h-4" />
                                    <span>Reference file attached</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                {isCompleted ? (
                                  <div className="text-green-600">
                                    {/* Only show grades if assignment allows it */}
                                    {submission?.autoGrade && (assignment as any).canSeeGrades && (
                                      <div className="font-bold text-lg">
                                        {submission.autoGrade.score}/{submission.autoGrade.maxScore || assignment.totalMarks}
                                      </div>
                                    )}
                                    <div className="text-sm">
                                      {(assignment as any).canSeeGrades ? 'Completed' : 'Submitted'}
                                    </div>
                                    {/* Show feedback if allowed */}
                                    {submission?.autoGrade?.detailedFeedback && (assignment as any).canSeeFeedback && (
                                      <div className="text-xs text-gray-500 mt-1 max-w-32 truncate">
                                        {submission.autoGrade.detailedFeedback}
                                      </div>
                                    )}
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
                      {!user?.classId || user.classId === 'default-class' ? (
                        <>
                          <p className="text-gray-500 mb-2">No assignments available yet.</p>
                          <p className="text-sm text-gray-400 mb-4">You need to join a class first to see assignments.</p>
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-sm text-emerald-700">
                              💡 <strong>Tip:</strong> Go to the "My Classes" tab and use a join code from your teacher to join their classroom.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-500">No assignments available yet.</p>
                          <p className="text-sm text-gray-400">Check back later for new assignments from your teacher!</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Assignment Details */}
                {selectedAssignment && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mt-4 md:mt-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {selectedAssignment.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {selectedAssignment.subject}
                        </span>
                        <span className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          {selectedAssignment.difficulty}
                        </span>
                        <span className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          {selectedAssignment.totalMarks} marks
                        </span>
                        {selectedAssignment.dueDate && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {selectedAssignment.description && (
                        <p className="text-gray-700 mb-4">{selectedAssignment.description}</p>
                      )}
                      
                      {/* Questions */}
                      <div className="mb-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">Questions</h4>
                        <div className="space-y-4">
                          {selectedAssignment.originalContent?.questions?.map((question: string, index: number) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-emerald-600">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800">{question}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {selectedAssignment.uploadedFileUrl && (
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-3">Reference File</h4>
                          <a
                            href={selectedAssignment.uploadedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View Assignment File
                          </a>
                        </div>
                      )}
                    </div>
                    
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
                    
                    {progress.metrics.strengths && progress.metrics.strengths.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-green-700 mb-2">Strengths</h4>
                        <div className="flex flex-wrap gap-2">
                          {progress.metrics.strengths.map((strength: string) => (
                            <span key={strength} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {progress.metrics.weaknesses && progress.metrics.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-orange-700 mb-2">Areas to Improve</h4>
                        <div className="flex flex-wrap gap-2">
                          {progress.metrics.weaknesses.map((weakness: string) => (
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
                  
                  {progress && progress.updates && progress.updates.length > 0 ? (
                    <div className="space-y-3">
                      {progress.updates.slice(0, 5).map((update: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{update.change}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(update.timestamp).toLocaleDateString()}
                            </p>
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
                showScoreNotifications={showScoreNotifications}
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
                        className="bg-gradient-to-br from-emerald-50 to-emerald-50 border border-emerald-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-all"
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
                              Teacher: {classData.teacherName || classData.teacherId || 'Teacher'}
                            </p>
                            {classData.teacherId && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                ID: {classData.teacherId}
                              </p>
                            )}
                          </div>
                          {classData.hasUnreadMessages && (
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-gray-700">
                              {classData.studentCount || 0} students
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-emerald-600" />
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
                            className="px-3 py-2 bg-emerald-500 text-white text-sm font-medium rounded-md hover:bg-emerald-600 transition-colors"
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
                    <p className="text-gray-600 mb-6">
                      You haven't joined any classes yet. Use a join code to join your teacher's classroom.
                    </p>
                    
                    {/* Join Classroom Component */}
                    <div className="max-w-md mx-auto mb-6">
                      <JoinClassroom
                        userId={user?.userId || ''}
                        userName={user?.name || user?.displayName || 'Student'}
                        userEmail={user?.email || ''}
                        onClassJoined={(classroomData) => {
                          console.log('Joined classroom:', classroomData);
                          // Refresh the classes list
                          fetchStudentClasses();
                          // Show success message
                          toast.success(`Welcome to ${classroomData.className}!`);
                        }}
                      />
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-emerald-700">
                        💡 <strong>Tip:</strong> Once you join a class, you'll be able to see class discussions, 
                        get personalized assignments, and chat with your teacher privately.
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
            {/* Join Classroom Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">Join a Classroom</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Use a join code from your teacher to join their classroom and start learning.
              </p>
              <JoinClassroom
                userId={user?.userId || ''}
                userName={user?.name || user?.displayName || 'Student'}
                userEmail={user?.email || ''}
                onClassJoined={(classroomData) => {
                  console.log('Joined classroom:', classroomData);
                  // Refresh the classes list
                  fetchStudentClasses();
                  // Switch to My Classes tab
                  setActiveTab('classes');
                  // Show success message
                  toast.success(`Welcome to ${classroomData.className}!`);
                }}
              />
            </div>

            {/* Question Chains Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-semibold text-gray-900">Discover Question Chains</h2>
              </div>
              <ClassDiscovery
                userId={user?.userId || ''}
                userRole="student"
                userName={user?.name || user?.displayName || 'Student'}
                userEmail={user?.email || ''}
                onChainJoined={(chainId) => {
                  console.log('Joined chain:', chainId);
                  toast.success('You have successfully joined the learning chain!');
                  // Refresh the chains list
                  fetchStudentClasses();
                  // Switch to My Classes tab
                  setActiveTab('classes');
                }}
              />
            </div>
          </div>
        )}

        {/* Adaptive Assignments Tab Content */}
        {activeTab === 'adaptive-assignments' && (
          <div className="space-y-8 pb-24">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-xl border border-emerald-200 p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Brain className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900">Adaptive Learning Assignments</h2>
              </div>
              <p className="text-gray-600">
                Experience personalized learning! Each assignment is tailored to your learning profile. 
                Choose which questions you'd like to attempt, and the system will adapt to your preferences.
              </p>
            </div>

            {/* Learning Assessment Prompt */}
            {!hasCompletedQuiz && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Complete Your Learning Assessment</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  To get the most out of adaptive assignments, please complete a quick 5-question learning assessment. 
                  This will help us understand your learning style and create perfectly personalized questions for you!
                </p>
                <LearningAssessmentQuiz
                  studentId={user?.userId || ''}
                  classId={user?.classId || 'default-class'}
                  grade="10"
                  onComplete={(profile) => {
                    setHasCompletedQuiz(true);
                    toast.success('Learning assessment complete! Your assignments will now be personalized.');
                  }}
                />
              </div>
            )}

            {/* Assignments List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Adaptive Assignments</h3>
              <StudentAssignmentView
                studentId={user?.userId || ''}
                classId={user?.classId || 'default-class'}
              />
            </div>
          </div>
        )}

        {/* Message Teacher Tab Content */}
        {activeTab === 'message' && (
          <div className="space-y-6">
            <div className="h-96">
              <StudentMessageTeacher
                studentId={user?.userId || ''}
                studentName={user?.name || user?.displayName || 'Student'}
                teacherId="teacher1" // For now, defaulting to teacher1
                teacherName="Teacher"
                isEmbedded={true}
              />
            </div>
          </div>
        )}

        {/* Class Chat Tab Content */}
        {activeTab === 'class-chat' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Classroom Chat</h2>
                <p className="text-gray-600">
                  Ask questions, share ideas, and chat with your teacher and classmates
                </p>
              </div>
              <div className="h-[calc(100vh-300px)] min-h-[500px]">
                <ClassChat
                  userId={user?.userId || ''}
                  userName={user?.name || user?.displayName || 'Student'}
                  role="student"
                  classId={user?.classId || undefined}
                  isEmbedded={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Score Notifications</h4>
                    <p className="text-sm text-gray-600">Show your score immediately after submitting assignments</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showScoreNotifications}
                      onChange={(e) => handleNotificationToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-900">About Score Notifications</h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        When enabled, you'll see your assignment score immediately after submission. 
                        When disabled, you'll only see a confirmation that your assignment was submitted successfully.
                        You can always view your scores later in the assignments section.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Name</h4>
                    <p className="text-sm text-gray-600">{user?.name || user?.displayName || 'Student'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">School</h4>
                    <p className="text-sm text-gray-600">{user?.schoolId?.toString() || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Role</h4>
                    <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}