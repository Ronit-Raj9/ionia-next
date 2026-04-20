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
  MessageCircle,
  Plus,
  Trash2,
  Brain,
  Search,
  X,
  Mail,
  GraduationCap,
  Home,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import GradingInterface from '@/components/GradingInterface';
import StudentSelector from '@/components/StudentSelector';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import ClassroomManager from '@/components/ClassroomManager';
import AcademicPlanner from '@/components/AcademicPlanner';
import TeacherAssignmentCreator from '@/components/TeacherAssignmentCreator';
import TeacherAnalyticsDashboard from '@/components/TeacherAnalyticsDashboard';
import StudyMaterialManager from '@/components/StudyMaterialManager';
import TeacherStudyMaterials from '@/components/TeacherStudyMaterials';
import OneToOneChat from '@/components/OneToOneChat';
import RoleSidebar, { SidebarSection } from '@/components/RoleSidebar';
import RoleLayout from '@/components/RoleLayout';
import { getUserDisplayName, getUserId } from '@/lib/userUtils';
import { Assignment, Submission, Progress, User } from '@/lib/db';
import { analyzeQuestion } from '@/lib/questionAnalyzer';
// OCR functionality moved to API route
import { adaptQuestionToLearningStyle } from '@/lib/learningStyleAdapter';
import { generateResourceRecommendations } from '@/lib/resourceLinker';

// Using Assignment interface from new system

// API Response interfaces for teacher dashboard
interface ClassProgressResponse {
  classInfo: {
    classId: string;
    schoolId: string | null;
    totalStudents: number;
  };
  classMetrics: {
    totalStudents: number;
    averageScore: number;
    completionRate: number;
    totalSubmissions: number;
    totalTimeSaved: number;
    lastUpdated: Date;
  };
  heatmap: {
    topic: string;
    percentage: number;
    studentCount: number;
  }[];
  studentProgress: any[];
  timestamp: string;
}

export default function TeacherDashboard() {
  const { user } = useRole();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progressData, setProgressData] = useState<ClassProgressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Form state
  const [questions, setQuestions] = useState('');
  const [questionsList, setQuestionsList] = useState<Array<{id: string, text: string, marks: number}>>([]);
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
  const [useAdvancedQuestions, setUseAdvancedQuestions] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Load selected class from localStorage on component mount
  useEffect(() => {
    const savedClassId = localStorage.getItem('teacher_selected_class_id');
    if (savedClassId) {
      setSelectedClassId(savedClassId);
    }
  }, []);

  // Save selected class to localStorage whenever it changes
  useEffect(() => {
    if (selectedClassId) {
      localStorage.setItem('teacher_selected_class_id', selectedClassId);
    } else {
      localStorage.removeItem('teacher_selected_class_id');
    }
  }, [selectedClassId]);
  
  // Enhanced features state
  const [questionAnalysis, setQuestionAnalysis] = useState<any>(null);
  const [enhancedOCR, setEnhancedOCR] = useState<any>(null);
  const [learningStyleAdaptations, setLearningStyleAdaptations] = useState<any[]>([]);
  const [resourceRecommendations, setResourceRecommendations] = useState<any[]>([]);
  const [selectedStudyMaterials, setSelectedStudyMaterials] = useState<any[]>([]);
  
  // Phase 2 state
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'grading' | 'analytics' | 'classrooms' | 'academic-planner' | 'adaptive-assignments' | 'study-materials' | 'chats'>('overview');
  
  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // Start collapsed (icons only)

  // Chat state (must be declared before sidebarSections that references it)
  const [chats, setChats] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [showAvailableUsers, setShowAvailableUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Define sidebar sections and items (after state declarations)
  const sidebarSections: SidebarSection[] = [
    {
      items: [
        {
          id: 'overview',
          label: 'Dashboard',
          icon: <Home className="w-5 h-5" />,
        },
      ],
    },
    {
      title: 'Assignments',
      items: [
        {
          id: 'create',
          label: 'Create Assignment',
          icon: <Upload className="w-5 h-5" />,
        },
        {
          id: 'grading',
          label: 'Grading Center',
          icon: <ClipboardCheck className="w-5 h-5" />,
        },
        {
          id: 'adaptive-assignments',
          label: 'Adaptive Assignments',
          icon: <Brain className="w-5 h-5" />,
        },
      ],
    },
    {
      title: 'Classroom',
      items: [
        {
          id: 'classrooms',
          label: 'Manage Classrooms',
          icon: <Users className="w-5 h-5" />,
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          id: 'academic-planner',
          label: 'Academic Planner',
          icon: <Calendar className="w-5 h-5" />,
        },
      ],
    },
    {
      title: 'Resources',
      items: [
        {
          id: 'study-materials',
          label: 'Study Materials',
          icon: <BookOpen className="w-5 h-5" />,
        },
        {
          id: 'chats',
          label: 'Messages',
          icon: <MessageCircle className="w-5 h-5" />,
          badge: chats.length > 0 ? chats.length : undefined,
        },
      ],
    },
  ];

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

  // Refetch assignments when selectedClassId changes
  useEffect(() => {
    if (user && selectedClassId) {
      fetchAssignments();
    }
  }, [selectedClassId]);

  // Auto-refresh assignment statistics every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchAssignments();
      fetchProgress();
      fetchEnhancedDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user, selectedClassId]);

  // Fetch chats when chats tab is active
  useEffect(() => {
    if (activeTab === 'chats' && user) {
      fetchChats();
      fetchAvailableUsers();
    }
  }, [activeTab, user]);

  const fetchAssignments = async () => {
    try {
      // Use selectedClassId if available, otherwise fetch all teacher's assignments
      const url = selectedClassId 
        ? `/api/assignments?role=${user?.role}&userId=${user?.userId}&classId=${selectedClassId}`
        : `/api/assignments?role=${user?.role}&userId=${user?.userId}`;
      
      console.log('🔍 Teacher fetching assignments from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Teacher assignments response:', data);
      
      if (data.success) {
        setAssignments(data.data);
        console.log(`✅ Loaded ${data.data.length} assignments for teacher`);
      } else {
        console.error('❌ Failed to fetch assignments:', data.error);
        toast.error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to fetch assignments');
    }
  };

  const fetchProgress = async () => {
    // Skip if no classId (teacher might not have a default class)
    if (!user?.classId) {
      return;
    }
    
    try {
      const response = await fetch(`/api/progress?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}`);
      const data = await response.json();
      
      if (data.success) {
        setProgressData(data.data);
      } else {
        // Don't show error toast for permission issues
        if (!data.error?.includes('permission')) {
          toast.error('Failed to fetch progress data');
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Don't show error toast for permission issues
    }
  };

  const fetchChats = async () => {
    if (!user) return;
    setChatsLoading(true);
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();
      if (data.success) {
        setChats(data.data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setChatsLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/chats/available-users');
      const data = await response.json();
      if (data.success) {
        setAvailableUsers(data.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const startChat = async (targetUserId: string) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId })
      });

      const data = await response.json();
      if (data.success) {
        const newChat = data.data.chat;
        setSelectedChat(newChat);
        setSelectedChatId(newChat.chatId);
        setShowUserProfile(false);
        setShowAvailableUsers(false);
        await fetchChats();
      } else {
        toast.error(data.error || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Chat deleted');
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
          setSelectedChat(null);
        }
        await fetchChats();
      } else {
        toast.error(data.error || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleChatSelect = (chat: any) => {
    setSelectedChatId(chat.chatId);
    setSelectedChat(chat);
  };

  const fetchEnhancedDashboardData = async () => {
    // Skip if no classId (teacher might not have a default class)
    if (!user?.classId) {
      return;
    }
    
    try {
      const response = await fetch(`/api/dashboard?role=${user?.role}&userId=${user?.userId}&classId=${user?.classId}&schoolId=${user?.schoolId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
        setAiSuggestions(data.data.suggestions || []);
      } else {
        // Silently log permission errors
        if (data.error?.includes('permission')) {
          console.log('Dashboard data not available for this class');
        } else {
          console.error('Failed to fetch enhanced dashboard data');
        }
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

  // Functions to manage questions list
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      text: '',
      marks: 1 // Default to 1 mark per question
    };
    setQuestionsList([...questionsList, newQuestion]);
  };

  const updateQuestion = (id: string, text: string) => {
    setQuestionsList(questionsList.map(q => 
      q.id === id ? { ...q, text } : q
    ));
  };

  const updateQuestionMarks = (id: string, marks: number) => {
    setQuestionsList(questionsList.map(q => 
      q.id === id ? { ...q, marks } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestionsList(questionsList.filter(q => q.id !== id));
  };

  const handleSubmitAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Determine which questions to use
    let finalQuestions: string[] = [];
    if (useAdvancedQuestions) {
      if (questionsList.length === 0) {
        toast.error('Please add at least one question');
        return;
      }
      finalQuestions = questionsList.map(q => q.text).filter(text => text.trim());
      if (finalQuestions.length === 0) {
        toast.error('Please fill in all question texts');
        return;
      }
    } else {
      if (!questions.trim() && !selectedFile) {
        toast.error('Please provide questions or upload a file');
        return;
      }
      finalQuestions = questions.split('\n').filter(q => q.trim());
    }

    setUploadLoading(true);
    
    // Enhanced features processing
    try {
      // Analyze questions for Bloom's taxonomy and cognitive complexity
      if (finalQuestions.length > 0) {
        const analysis = await analyzeQuestion(finalQuestions[0], subject, '10');
        setQuestionAnalysis(analysis);
        console.log('Question Analysis:', analysis);
      }
      
      // Process file with enhanced OCR if uploaded
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('image', selectedFile);
          
          const response = await fetch('/api/ocr/process', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            setEnhancedOCR(result.data);
            console.log('Enhanced OCR Result:', result.data);
          } else {
            console.error('OCR processing failed');
          }
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
      
      // Generate resource recommendations
      const recommendations = await generateResourceRecommendations({
        assignmentId: 'temp-' + Date.now(),
        questions: finalQuestions,
        subject: subject,
        grade: '10',
        topic: 'General',
        learningObjectives: ['Master key concepts', 'Apply problem-solving skills'],
        targetDifficulty: difficulty as 'easy' | 'medium' | 'hard'
      });
      setResourceRecommendations(recommendations);
      console.log('Resource Recommendations:', recommendations);
      
    } catch (error) {
      console.error('Enhanced features processing error:', error);
      // Continue with assignment creation even if enhanced features fail
    }
    
    try {
      // Determine classId - use selectedClassId if available, otherwise derive from selected students
      let classIdToUse = selectedClassId;
      if (!classIdToUse && selectedStudents.length > 0) {
        // Try to get classId from the first selected student
        const firstStudent = selectedStudents[0];
        if (firstStudent.classId) {
          classIdToUse = firstStudent.classId;
          console.log('🔍 Derived classId from selected student:', classIdToUse);
        }
      }
      
      console.log('🔍 Assignment creation - selectedClassId:', selectedClassId, 'classIdToUse:', classIdToUse, 'selectedStudents:', selectedStudents.length);
      
      const formData = new FormData();
      formData.append('role', user?.role || '');
      formData.append('userId', user?.userId || '');
      formData.append('classId', classIdToUse || '');
      formData.append('questions', useAdvancedQuestions ? finalQuestions.join('\n') : questions);
      formData.append('title', assignmentTitle);
      formData.append('description', description);
      formData.append('subject', subject);
      formData.append('difficulty', difficulty);
      formData.append('totalMarks', totalMarks.toString());
      formData.append('showMarksToStudents', showMarksToStudents.toString());
      formData.append('showFeedbackToStudents', showFeedbackToStudents.toString());
      formData.append('assignedStudents', JSON.stringify(selectedStudents.map(s => s.id)));
      
      // Add question details if using advanced mode
      if (useAdvancedQuestions) {
        formData.append('questionDetails', JSON.stringify(questionsList));
      }
      
      // Add enhanced features data
      if (questionAnalysis) {
        formData.append('questionAnalysis', JSON.stringify(questionAnalysis));
      }
      if (enhancedOCR) {
        formData.append('enhancedOCR', JSON.stringify(enhancedOCR));
      }
      if (resourceRecommendations.length > 0) {
        formData.append('resourceRecommendations', JSON.stringify(resourceRecommendations));
      }
      if (selectedStudyMaterials.length > 0) {
        formData.append('selectedStudyMaterials', JSON.stringify(selectedStudyMaterials));
      }
      
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
        setQuestionsList([]);
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
        setUseAdvancedQuestions(false);
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

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
    toast.success('Logged out successfully');
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
    <div className="min-h-screen">
      {/* Sidebar */}
      <RoleSidebar
        sections={sidebarSections}
        activeItemId={activeTab}
        onItemClick={(itemId) => setActiveTab(itemId as any)}
        userRole={user.role}
        userName={user.name || user.displayName || 'Teacher'}
        userEmail={user.email}
        onLogout={handleLogout}
        enableSearch={true}
        enableKeyboardNav={true}
      />

      {/* Main Content */}
      <RoleLayout
        sidebarExpanded={sidebarExpanded}
        activeSection={activeTab}
      >

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
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
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-600" />
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
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Assignments</h2>
                  <button
                    onClick={() => {
                      fetchAssignments();
                      fetchProgress();
                      fetchEnhancedDashboardData();
                      toast.success('Dashboard refreshed');
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
                              <div className="flex items-center space-x-1 text-sm text-emerald-600 mt-1">
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
        <div className="space-y-6">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Create Assignment</h1>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignment Creation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Assignment</h2>
              
              {/* Class Selection Indicator */}
              {selectedClassId || selectedStudents.length > 0 ? (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                      <span className="text-sm text-emerald-800">
                        <strong>Ready to Create Assignment:</strong> 
                        {selectedClassId ? ' Class selected' : ' Students selected'}
                        {selectedStudents.length > 0 && (
                          <span className="ml-2 text-emerald-700">
                            ({selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected)
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClassId('');
                        setSelectedStudents([]);
                        toast.success('Class selection cleared');
                      }}
                      className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      <strong>No Class Selected:</strong> Please select a class from the "Classrooms" tab first
                    </span>
                  </div>
                </div>
              )}
              
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
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Questions
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={useAdvancedQuestions}
                          onChange={(e) => setUseAdvancedQuestions(e.target.checked)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Advanced Mode</span>
                      </label>
                    </div>
                  </div>
                  
                  {useAdvancedQuestions ? (
                    <div className="space-y-4">
                      {questionsList.map((question, index) => (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-emerald-600">Q{index + 1}</span>
                            </div>
                            <div className="flex-1 space-y-3">
                              <textarea
                                value={question.text}
                                onChange={(e) => updateQuestion(question.id, e.target.value)}
                                placeholder={`Enter question ${index + 1}...`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                rows={2}
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm text-gray-600">Marks:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={question.marks}
                                    onChange={(e) => updateQuestionMarks(question.id, parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeQuestion(question.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                      >
                        <Plus className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                        <span className="text-sm text-gray-600">Add Question</span>
                      </button>
                      
                      {questionsList.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <p className="text-sm text-emerald-700">
                            <strong>Total Questions:</strong> {questionsList.length} | 
                            <strong> Total Marks:</strong> {questionsList.reduce((sum, q) => sum + q.marks, 0)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                      placeholder="Enter questions, one per line:&#10;1. Solve for x: 2x + 5 = 13&#10;2. Calculate the area of a rectangle with length 8cm and width 5cm&#10;3. Simplify: 3/4 + 1/8"
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      rows={6}
                    />
                  )}
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
                  disabled={uploadLoading || (!selectedClassId && selectedStudents.length === 0) || (useAdvancedQuestions ? questionsList.length === 0 : (!questions.trim() && !selectedFile))}
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
        )}

        {/* Grading Tab */}
        {activeTab === 'grading' && (
          <div className="space-y-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Grading</h1>
            </div>
            <div className="h-screen">
            <GradingInterface
              teacherId={user?.userId || ''}
              teacherName={user?.name || user?.displayName || 'Teacher'}
              onGradeSubmitted={() => {
                toast.success('Grade updated successfully!');
              }}
            />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            </div>
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
          </div>
        )}

        {/* Classrooms Tab */}
        {activeTab === 'classrooms' && (
          <div className="space-y-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Classrooms</h1>
            </div>
            {!user?.userId || !user?.schoolId ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-800 mb-4">
                  ⚠️ Missing user data. Please log out and log back in to access classrooms.
                  Your user profile needs to be properly set up with school information.
                </p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  Log Out & Refresh
                </button>
              </div>
            ) : (
              <>
                <ClassroomManager
                  userId={user?.userId || ''}
                  userName={user?.name || user?.displayName || 'Teacher'}
                  role="teacher"
                  schoolId={user?.schoolId?.toString() || ''}
                  onClassSelected={(classId) => {
                    setSelectedClassId(classId);
                    toast.success('Class selected for assignment creation');
                  }}
                />
                
                {/* Selected Class Indicator */}
                {selectedClassId && (
                  <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
                        <span className="text-sm text-emerald-800">
                          <strong>Active Class:</strong> Selected class is active for assignment creation
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedClassId('')}
                        className="text-sm text-emerald-600 hover:text-emerald-700 underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'academic-planner' && (
          <div className="space-y-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Academic Planner</h1>
            </div>
          <div className="min-h-screen pb-24">
            <AcademicPlanner
              classId={user?.classId || 'default-class'}
            />
            </div>
          </div>
        )}

        {activeTab === 'adaptive-assignments' && (
          <div className="space-y-8 pb-24">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Adaptive Assignments</h1>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-xl border border-emerald-200 p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Brain className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-bold text-gray-900">Adaptive Learning Assignments</h2>
              </div>
              <p className="text-gray-600">
                Create assignments where each student receives personalized question variants based on their learning profile. 
                Students choose which questions to attempt, and the system tracks their choices to understand their preferences and anxieties.
              </p>
            </div>

            {/* Assignment Creator */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Adaptive Assignment</h3>
              <TeacherAssignmentCreator
                teacherId={user?.userId || ''}
                classId={user?.classId || 'default-class'}
                subject={subject || 'Math'}
                grade="10"
                teacherSchoolId={user?.schoolId?.toString() || 'demo-school-delhi-2025'}
                onComplete={(assignmentId: string, questionSetId: string) => {
                  toast.success('Adaptive assignment created successfully!');
                  console.log('Created assignment:', assignmentId, questionSetId);
                }}
                onCancel={() => {
                  toast('Assignment creation cancelled');
                }}
              />
            </div>

            {/* Analytics Dashboard - Requires an assignmentId */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Student Analytics & Insights</h3>
              <p className="text-gray-600 text-center py-8">
                Create an adaptive assignment above to view student analytics and insights here.
              </p>
              {/* TeacherAnalyticsDashboard requires assignmentId, which we'll get after creating an assignment */}
            </div>
          </div>
        )}

        {activeTab === 'study-materials' && (
          <div className="space-y-6 pb-24">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
            </div>
            <TeacherStudyMaterials classId={selectedClassId || undefined} />
          </div>
        )}

        {/* Chats Tab Content */}
        {activeTab === 'chats' && (
          <div className="space-y-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex h-[calc(100vh-16rem)]">
                {/* Chat List Sidebar */}
                <div className="w-80 border-r bg-gray-50 flex flex-col">
                  <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">My Chats</h3>
                      <button
                        onClick={() => setShowAvailableUsers(true)}
                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
                      >
                        New Chat
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search chats..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Chat List */}
                  <div className="flex-1 overflow-y-auto">
                    {chatsLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      </div>
                    ) : chats.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-gray-500 px-4">
                        <MessageCircle className="w-12 h-12 mb-2 text-gray-400" />
                        <p className="text-sm text-center">No chats yet</p>
                        <button
                          onClick={() => setShowAvailableUsers(true)}
                          className="mt-2 text-emerald-600 hover:text-emerald-700 text-sm"
                        >
                          Start your first chat
                        </button>
                      </div>
                    ) : (
                      chats
                        .filter(chat => chat.otherUser.name.toLowerCase().includes(chatSearchQuery.toLowerCase()))
                        .map((chat) => (
                          <div
                            key={chat.chatId}
                            onClick={() => handleChatSelect(chat)}
                            className={`p-4 border-b hover:bg-gray-100 cursor-pointer transition-colors ${
                              selectedChatId === chat.chatId ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                {chat.otherUser.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-semibold text-gray-900 truncate">{chat.otherUser.name}</p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteChat(chat.chatId);
                                    }}
                                    className="p-1 hover:bg-red-100 rounded text-red-600"
                                    title="Delete chat"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-500 mb-1">Student</p>
                                {chat.lastMessage && (
                                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage.content}</p>
                                )}
                                {chat.isBlocked && (
                                  <p className="text-xs text-red-600 mt-1">Chat blocked</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-white">
                  {selectedChatId && selectedChat ? (
                    <OneToOneChat
                      chatId={selectedChatId}
                      otherUser={selectedChat.otherUser}
                      currentUserId={user?.userId || ''}
                      currentUserRole="teacher"
                      isBlocked={selectedChat.isBlocked}
                      blockedBy={selectedChat.blockedBy}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-emerald-50">
                      <div className="text-center px-4">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                          {chats.length === 0 ? "Start Your First Conversation" : "Select a chat to start messaging"}
                        </h3>
                        <p className="text-gray-500 mb-6 italic">
                          "{[
                            "Teaching is the one profession that creates all other professions.",
                            "A good teacher can inspire hope, ignite the imagination, and instill a love of learning.",
                            "The art of teaching is the art of assisting discovery.",
                            "To teach is to touch a life forever.",
                            "Education is not the filling of a pail, but the lighting of a fire."
                          ][Math.floor(Math.random() * 5)]}"
                        </p>
                        {chats.length === 0 && (
                          <button
                            onClick={() => setShowAvailableUsers(true)}
                            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            Start a Chat
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Users Modal */}
        {showAvailableUsers && activeTab === 'chats' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Start New Chat</h2>
                <button
                  onClick={() => {
                    setShowAvailableUsers(false);
                    setSelectedUser(null);
                    setShowUserProfile(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {showUserProfile && selectedUser ? (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setShowUserProfile(false);
                      setSelectedUser(null);
                    }}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    ← Back to list
                  </button>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                        <p className="text-gray-600">{selectedUser.email}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <GraduationCap className="w-5 h-5 mr-2" />
                        Classes
                      </h4>
                      {selectedUser.classes?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser.classes.map((cls: any, idx: number) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded">
                              <p className="font-medium">{cls.className}</p>
                              <p className="text-sm text-gray-600">{cls.subject}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No classes assigned</p>
                      )}
                    </div>
                    <button
                      onClick={() => startChat(selectedUser.userId)}
                      className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableUsers
                    .filter(student => 
                      student.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                      student.email.toLowerCase().includes(chatSearchQuery.toLowerCase())
                    )
                    .length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No students found</p>
                  ) : (
                    availableUsers
                      .filter(student => 
                        student.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                        student.email.toLowerCase().includes(chatSearchQuery.toLowerCase())
                      )
                      .map((student) => (
                        <div
                          key={student.userId}
                          onClick={() => {
                            setSelectedUser(student);
                            setShowUserProfile(true);
                          }}
                          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            {student.hasChatted && (
                              <span className="text-xs text-emerald-600">Has existing chat</span>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student Selector Modal */}
        {showStudentSelector && (
            <StudentSelector
              onStudentsSelected={(students, selectedClass) => {
                setSelectedStudents(students.filter(s => s.isSelected));
                setShowStudentSelector(false);
                if (selectedClass) {
                  setSelectedClassId(selectedClass._id?.toString() || '');
                  toast.success(`Selected ${students.length} students from ${selectedClass.className}`);
                }
              }}
              onClose={() => setShowStudentSelector(false)}
              classId={user?.classId || 'default-class'}
              teacherId={user?.userId || ''}
              teacherRole={user?.role || 'teacher'}
              teacherSchoolId={user?.schoolId?.toString() || ''}
            />
        )}
      </RoleLayout>
    </div>
  );
}
