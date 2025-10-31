"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Calendar,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  BarChart3,
  Target,
  Brain,
  Zap,
  Award,
  Users,
  Settings,
  RefreshCw,
  X,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRole } from '@/contexts/RoleContext';

interface SubTopic {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  learningObjectives: string[];
  keyConcepts: string[];
  activities: string[];
  assessmentMethods: string[];
  resources: {
    type: 'textbook' | 'video' | 'article' | 'exercise' | 'lab';
    title: string;
    description?: string;
    url?: string;
  }[];
  completed: boolean;
  completedDate?: Date;
  notes?: string;
}

interface AcademicPlan {
  _id: string;
  subject: string;
  grade: string;
  academicYear: string;
  syllabusFile: {
    originalName: string;
    url: string;
  };
  calendarFile?: {
    originalName: string;
    url: string;
  };
  generatedPlan: {
    overview: {
      totalWeeks: number;
      totalHours: number;
      description: string;
      mainGoals: string[];
    };
    topics: Array<{
      id: string;
      title: string;
      description: string;
      difficulty: 'basic' | 'intermediate' | 'advanced';
      estimatedHours: number;
      subtopics?: SubTopic[];
      completed: boolean;
      weekNumber: number;
      monthNumber: number;
      startWeek?: number;
      endWeek?: number;
    }>;
  };
  progress: {
    totalTopics: number;
    completedTopics: number;
    completionPercentage: number;
    lastUpdated: string;
  };
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface AcademicPlannerProps {
  classId: string;
  onClose?: () => void;
}

export default function AcademicPlanner({ classId, onClose }: AcademicPlannerProps) {
  const { user } = useRole();
  const [academicPlans, setAcademicPlans] = useState<AcademicPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<AcademicPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'view' | 'progress'>('list');

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    grade: '',
    academicYear: new Date().getFullYear().toString(),
    syllabusFile: null as File | null,
    calendarFile: null as File | null
  });

  useEffect(() => {
    if (user && classId) {
      fetchAcademicPlans();
    }
  }, [user, classId]);

  const fetchAcademicPlans = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/academic-planner?teacherId=${user.userId}&classId=${classId}&role=${user.role}`);
      const data = await response.json();

      if (data.success) {
        setAcademicPlans(data.academicPlans);
      } else {
        toast.error(data.error || 'Failed to fetch academic plans');
      }
    } catch (error) {
      console.error('Error fetching academic plans:', error);
      toast.error('Failed to fetch academic plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.syllabusFile) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploadLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('teacherId', user.userId);
      formDataToSend.append('classId', classId);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('grade', formData.grade);
      formDataToSend.append('academicYear', formData.academicYear);
      formDataToSend.append('role', user.role);
      formDataToSend.append('syllabusFile', formData.syllabusFile);
      
      if (formData.calendarFile) {
        formDataToSend.append('calendarFile', formData.calendarFile);
      }

      const response = await fetch('/api/academic-planner', {
        method: 'POST',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Academic plan created successfully!');
        setShowCreateForm(false);
        setFormData({
          subject: '',
          grade: '',
          academicYear: new Date().getFullYear().toString(),
          syllabusFile: null,
          calendarFile: null
        });
        fetchAcademicPlans();
        setActiveView('list');
      } else {
        toast.error(data.error || 'Failed to create academic plan');
      }
    } catch (error) {
      console.error('Error creating academic plan:', error);
      toast.error('Failed to create academic plan');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'syllabus' | 'calendar') => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF and DOCX files are supported');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error('File size must be less than 10MB');
        return;
      }

      if (fileType === 'syllabus') {
        setFormData(prev => ({ ...prev, syllabusFile: file }));
      } else {
        setFormData(prev => ({ ...prev, calendarFile: file }));
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderCreateForm = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Create Academic Plan</h3>
        <button
          onClick={() => {
            setShowCreateForm(false);
            setActiveView('list');
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleCreatePlan} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Mathematics, Science"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade *
            </label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value="">Select Grade</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                <option key={grade} value={grade.toString()}>Grade {grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Year *
            </label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., 2024-2025"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Syllabus File * (PDF/DOCX)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'syllabus')}
                accept=".pdf,.docx"
                className="hidden"
                id="syllabus-upload"
                required
              />
              <label
                htmlFor="syllabus-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {formData.syllabusFile ? formData.syllabusFile.name : 'Click to upload syllabus'}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Academic Calendar (PDF/DOCX) - Optional
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-emerald-500 transition-colors">
              <input
                type="file"
                onChange={(e) => handleFileChange(e, 'calendar')}
                accept=".pdf,.docx"
                className="hidden"
                id="calendar-upload"
              />
              <label
                htmlFor="calendar-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Calendar className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {formData.calendarFile ? formData.calendarFile.name : 'Click to upload calendar'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              setActiveView('list');
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploadLoading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {uploadLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>{uploadLoading ? 'Creating Plan...' : 'Create Plan'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );

  const renderPlansList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Academic Plans</h2>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setActiveView('create');
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : academicPlans.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Academic Plans Yet</h3>
          <p className="text-gray-600 mb-6">Create your first academic plan by uploading a syllabus</p>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setActiveView('create');
            }}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Create Academic Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {academicPlans.map((plan) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedPlan(plan);
                setActiveView('view');
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">{plan.subject}</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  plan.status === 'active' ? 'bg-green-100 text-green-800' :
                  plan.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {plan.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Grade:</span>
                  <span className="font-medium">{plan.grade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Academic Year:</span>
                  <span className="font-medium">{plan.academicYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Topics:</span>
                  <span className="font-medium">{plan.progress.totalTopics}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{plan.progress.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${plan.progress.completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Created {new Date(plan.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPlanDetails = () => {
    if (!selectedPlan) return null;

    const handleTopicToggle = async (topicId: string, completed: boolean) => {
      try {
        const response = await fetch('/api/academic-planner/progress', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            planId: selectedPlan._id,
            teacherId: user?.userId,
            role: user?.role,
            topicUpdates: [{
              topicId,
              completed,
              notes: ''
            }]
          })
        });

        const data = await response.json();
        if (data.success) {
          // Update local state
          setSelectedPlan(prev => {
            if (!prev) return null;
            return {
              ...prev,
              generatedPlan: {
                ...prev.generatedPlan,
                topics: prev.generatedPlan.topics.map(topic => 
                  topic.id === topicId ? { ...topic, completed } : topic
                )
              },
              progress: {
                ...prev.progress,
                completedTopics: completed 
                  ? prev.progress.completedTopics + 1 
                  : prev.progress.completedTopics - 1,
                completionPercentage: Math.round(
                  ((completed ? prev.progress.completedTopics + 1 : prev.progress.completedTopics - 1) / 
                   prev.progress.totalTopics) * 100
                )
              }
            };
          });
          toast.success(completed ? 'Topic marked as completed!' : 'Topic marked as pending');
        } else {
          toast.error('Failed to update topic status');
        }
      } catch (error) {
        console.error('Error updating topic:', error);
        toast.error('Failed to update topic status');
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Plans</span>
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView('progress')}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Progress</span>
            </button>
            <button
              onClick={() => fetchAcademicPlans()}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{selectedPlan.subject} - Grade {selectedPlan.grade}</h2>
              <p className="text-gray-600 text-lg">Academic Year: {selectedPlan.academicYear}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-emerald-600">{selectedPlan.progress.completionPercentage}%</div>
              <div className="text-sm text-gray-600">Complete</div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${selectedPlan.progress.completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-emerald-900 text-lg">Total Topics</span>
              </div>
              <div className="text-3xl font-bold text-emerald-700">{selectedPlan.progress.totalTopics}</div>
              <div className="text-sm text-emerald-600 mt-1">Curriculum topics</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-blue-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-blue-900 text-lg">Completed</span>
              </div>
              <div className="text-3xl font-bold text-emerald-700">{selectedPlan.progress.completedTopics}</div>
              <div className="text-sm text-emerald-600 mt-1">Topics finished</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-orange-900 text-lg">Remaining</span>
              </div>
              <div className="text-3xl font-bold text-orange-700">
                {selectedPlan.progress.totalTopics - selectedPlan.progress.completedTopics}
              </div>
              <div className="text-sm text-orange-600 mt-1">Topics to cover</div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-emerald-600" />
              Course Overview
            </h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4 text-lg leading-relaxed">{selectedPlan.generatedPlan.overview.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{selectedPlan.generatedPlan.overview.totalWeeks}</div>
                  <div className="text-sm text-gray-600">Weeks Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{selectedPlan.generatedPlan.overview.totalHours}</div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round(selectedPlan.generatedPlan.overview.totalHours / selectedPlan.generatedPlan.overview.totalWeeks)}
                  </div>
                  <div className="text-sm text-gray-600">Hours per Week</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Target className="w-5 h-5 mr-2 text-emerald-600" />
                Topics Breakdown
              </h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Click the checkbox to mark topics as completed
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>← Scroll horizontally →</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto pb-8 mb-8 horizontal-scroll topic-cards-container">
              <div className="flex space-x-4 min-w-max">
                {selectedPlan.generatedPlan.topics.map((topic, index) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-80 flex-shrink-0 p-6 border-2 rounded-xl transition-all duration-200 hover:shadow-md ${
                      topic.completed 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start space-x-4 mb-4">
                        <button
                          onClick={() => handleTopicToggle(topic.id, !topic.completed)}
                          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            topic.completed
                              ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                              : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
                          }`}
                        >
                          {topic.completed && <CheckCircle className="w-4 h-4" />}
                        </button>
                        
                        <div className="flex-1">
                          <h4 className={`text-lg font-semibold mb-2 ${
                            topic.completed ? 'text-green-800 line-through' : 'text-gray-900'
                          }`}>
                            {topic.title}
                          </h4>
                        </div>
                      </div>
                      
                      <div className="flex-1 mb-4">
                        <p className={`text-gray-600 leading-relaxed text-sm ${
                          topic.completed ? 'text-green-600' : ''
                        }`}>
                          {topic.description}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            topic.difficulty === 'basic' ? 'bg-green-100 text-green-800' :
                            topic.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {topic.difficulty.charAt(0).toUpperCase() + topic.difficulty.slice(1)}
                          </span>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{topic.estimatedHours}h</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Week {topic.weekNumber}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Subtopics */}
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-xs font-medium text-gray-700 mb-2">Subtopics:</div>
                            {topic.subtopics.slice(0, 3).map((subtopic, subIndex) => (
                              <div key={subtopic.id} className="flex items-center space-x-2 text-xs">
                                <div className={`w-2 h-2 rounded-full ${
                                  subtopic.completed ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                                <span className={`${
                                  subtopic.completed ? 'text-green-600 line-through' : 'text-gray-600'
                                }`}>
                                  {subtopic.title}
                                </span>
                                <span className="text-gray-500">({subtopic.estimatedHours}h)</span>
                              </div>
                            ))}
                            {topic.subtopics.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{topic.subtopics.length - 3} more subtopics
                              </div>
                            )}
                          </div>
                        )}
                        
                        {topic.completed && (
                          <div className="p-3 bg-green-100 rounded-lg">
                            <div className="flex items-center space-x-2 text-green-800">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Completed</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 p-6 pb-24 academic-planner-container">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeView === 'list' && (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderPlansList()}
            </motion.div>
          )}
          
          {activeView === 'create' && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderCreateForm()}
            </motion.div>
          )}
          
          {activeView === 'view' && (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderPlanDetails()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
