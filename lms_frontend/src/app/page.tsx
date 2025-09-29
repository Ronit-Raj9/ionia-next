"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  Award,
  ArrowRight,
  Play,
  BarChart3,
  Zap,
  GraduationCap,
  UserCheck,
  Settings
} from 'lucide-react';
import { useRole, useStudentIds, UserRole } from '@/contexts/RoleContext';
import toast from 'react-hot-toast';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 }
};

const features = [
  {
    title: 'Adaptive Question Chaining',
    description: 'Intelligent question sequencing that adapts to your learning pace and focuses on your weak areas',
    icon: <Brain className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Smart Learning Paths',
    description: 'Personalized learning journeys that guide you through concepts in the most effective order',
    icon: <Target className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Real-time Progress Tracking',
    description: 'Monitor your learning progress with detailed analytics and performance insights',
    icon: <BarChart3 className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Interactive Learning',
    description: 'Engage with questions through multiple formats - theoretical, numerical, diagrammatic, and critical thinking',
    icon: <Zap className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Achievement System',
    description: 'Stay motivated with badges, streaks, and milestones that celebrate your learning journey',
    icon: <Award className="w-8 h-8 text-yellow-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Collaborative Learning',
    description: 'Learn together with peers, share insights, and participate in group challenges',
    icon: <Users className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  }
];

const stats = [
  { label: 'Questions Available', value: '50K+', icon: <BookOpen className="w-6 h-6" /> },
  { label: 'Active Learners', value: '10K+', icon: <Users className="w-6 h-6" /> },
  { label: 'Learning Paths', value: '500+', icon: <Target className="w-6 h-6" /> },
  { label: 'Success Rate', value: '95%', icon: <TrendingUp className="w-6 h-6" /> }
];

export default function Home() {
  const router = useRouter();
  const { user, setRole } = useRole();
  const studentIds = useStudentIds();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('student1');
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
  });

  const handleGetStarted = () => {
    console.log('Get Started clicked!', { user, showRoleSelection });
    try {
      if (user) {
        // User already has a role, redirect to appropriate dashboard
        console.log('User exists, redirecting to:', user.role);
        redirectToRolePage(user.role);
      } else {
        // Show role selection
        console.log('No user, showing role selection');
        setShowRoleSelection(true);
      }
    } catch (error) {
      console.error('Error in handleGetStarted:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleRoleSelect = (role: UserRole, mockUserId?: string) => {
    console.log('Role selected:', { role, mockUserId });
    try {
      if (role === 'student') {
        // For students, we still need the student ID selection
        setRole(role, mockUserId);
        setShowRoleSelection(false);
        redirectToRolePage(role);
      } else {
        // For teacher and admin, show the form
        setSelectedRole(role);
        setShowRoleSelection(false);
        setShowUserForm(true);
      }
    } catch (error) {
      console.error('Error in handleRoleSelect:', error);
      toast.error('Failed to select role. Please try again.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { userForm, selectedRole, selectedStudentId });
    
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!selectedRole) {
      console.error('No role selected');
      toast.error('Please select a role first');
      return;
    }

    // Generate mock user ID based on role
    let mockUserId: string;
    if (selectedRole === 'teacher') {
      mockUserId = 'teacher1';
    } else if (selectedRole === 'admin') {
      mockUserId = 'admin1';
    } else {
      // For students, assign based on existing students or create new one
      mockUserId = selectedStudentId;
    }
    
    // Set role with user info
    setRole(selectedRole, mockUserId);
    
    // Store additional user info in localStorage
    localStorage.setItem('ionia_user_info', JSON.stringify({
      name: userForm.name,
      email: userForm.email,
      role: selectedRole,
      mockUserId: mockUserId,
    }));
    
    // Reset form and redirect
    setShowUserForm(false);
    setUserForm({ name: '', email: '' });
    setSelectedRole(null);
    redirectToRolePage(selectedRole);
  };

  const handleFormCancel = () => {
    setShowUserForm(false);
    setUserForm({ name: '', email: '' });
    setSelectedRole(null);
    setShowRoleSelection(true);
  };

  const redirectToRolePage = (role: UserRole) => {
    switch (role) {
      case 'teacher':
        router.push('/teacher');
        break;
      case 'student':
        router.push('/student');
        break;
      case 'admin':
        router.push('/admin');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const handleLearnMore = () => {
    router.push('/learn');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div 
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
              variants={fadeIn}
            >
              Intelligent{' '}
              <span className="lms-gradient-text">Learning</span>
              <br />
              Management System
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
              variants={fadeIn}
            >
              Experience adaptive learning with intelligent question chaining that adapts to your pace, 
              focuses on your weak areas, and ensures comprehensive syllabus coverage.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={fadeIn}
            >
            <button 
              onClick={handleGetStarted}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-lg px-8 py-4 rounded-xl flex items-center gap-2 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {user ? `Continue as ${user.displayName}` : 'Get Started'}
              <ArrowRight className="w-5 h-5" />
            </button>
              
              <button 
                onClick={handleLearnMore}
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium text-lg px-8 py-4 rounded-xl flex items-center gap-2 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Play className="w-5 h-5" />
                Learn More
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                className="text-center"
                variants={scaleIn}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                  <div className="text-emerald-600">
                    {stat.icon}
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Our{' '}
              <span className="lms-gradient-text">LMS?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our Learning Management System revolutionizes education with intelligent features 
              designed to maximize your learning potential.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                variants={fadeIn}
                className="group p-8 rounded-3xl bg-white hover:bg-gradient-to-br hover:from-gray-50 hover:to-white shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-gray-200"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <motion.div 
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-teal-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already experiencing the power of adaptive learning. 
              Start your journey today!
            </p>
            <button 
              onClick={handleGetStarted}
              className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Start Learning Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Role Selection Modal */}
      {showRoleSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Choose Your Role
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              Select how you'd like to experience Ionia
            </p>
            
            <div className="space-y-4">
              {/* Teacher Option */}
              <button
                onClick={() => handleRoleSelect('teacher')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Teacher</h3>
                  <p className="text-sm text-gray-600">Upload assignments and track student progress</p>
                </div>
              </button>

              {/* Student Option */}
              <button
                onClick={() => {
                  setSelectedRole('student');
                  setShowRoleSelection(false);
                  setShowUserForm(true);
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Student</h3>
                  <p className="text-sm text-gray-600">Receive personalized assignments and submit answers</p>
                </div>
              </button>

              {/* Admin Option */}
              <button
                onClick={() => handleRoleSelect('admin')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Admin</h3>
                  <p className="text-sm text-gray-600">View class analytics and manage system</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowRoleSelection(false)}
              className="w-full mt-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* User Information Form Modal */}
      {showUserForm && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {selectedRole === 'teacher' ? 'Teacher Information' : 
               selectedRole === 'admin' ? 'Admin Information' : 'Student Information'}
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              Please provide your details to continue
            </p>
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Student ID Selection for Students */}
              {selectedRole === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student ID
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {studentIds.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="Enter your email address"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${
                    selectedRole === 'teacher' ? 'bg-emerald-500 hover:bg-emerald-600' :
                    selectedRole === 'student' ? 'bg-blue-500 hover:bg-blue-600' :
                    'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  Continue as {selectedRole === 'teacher' ? 'Teacher' : 
                              selectedRole === 'admin' ? 'Admin' : 'Student'}
                </button>
                
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Back
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
