"use client";

import React from 'react';
import { useRole } from '@/contexts/RoleContext';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Award,
  Play,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';

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

export default function Dashboard() {
  const { user } = useRole();

  const stats = [
    {
      title: 'Questions Attempted',
      value: 0, // Will be loaded from API
      icon: <BookOpen className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Accuracy Rate',
      value: '0%', // Will be loaded from API
      icon: <Target className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Learning Streak',
      value: '0 days', // Will be loaded from API
      icon: <Zap className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Average Score',
      value: '0%', // Will be loaded from API
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const quickActions = [
    {
      title: 'Start Learning',
      description: 'Begin a new learning session with adaptive questions',
      icon: <Play className="w-8 h-8" />,
      href: '/learn',
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      title: 'View Progress',
      description: 'Track your learning progress and analytics',
      icon: <BarChart3 className="w-8 h-8" />,
      href: '/progress',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Question Chains',
      description: 'Explore available question chains and topics',
      icon: <Brain className="w-8 h-8" />,
      href: '/chains',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const recentActivity = [
    {
      title: 'Completed Physics Chain',
      score: 85,
      time: '2 hours ago',
      type: 'completion'
    },
    {
      title: 'Started Chemistry Basics',
      score: null,
      time: '1 day ago',
      type: 'start'
    },
    {
      title: 'Achieved 7-day streak',
      score: null,
      time: '2 days ago',
      type: 'achievement'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div 
          className="mb-8"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.displayName || user?.name || 'Student'}!
            {user?.role.includes('guest') && (
              <span className="ml-3 px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-full">
                Guest Mode
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            {user?.role.includes('guest')
              ? "You're in guest mode. Explore the LMS features and UI without creating an account."
              : "Ready to continue your learning journey? Let's make today productive."
            }
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.title}
              className="lms-card p-6"
              variants={fadeIn}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <div className={stat.color}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div 
            className="lg:col-span-2"
            variants={fadeIn}
            initial="initial"
            animate="animate"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <motion.a
                  key={action.title}
                  href={action.href}
                  className="lms-card p-6 hover:shadow-xl transition-all duration-300 group"
                  variants={fadeIn}
                  whileHover={{ y: -2 }}
                >
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <div className="text-white">
                      {action.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            variants={fadeIn}
            initial="initial"
            animate="animate"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <div className="lms-card p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    {activity.score && (
                      <div className="text-sm font-semibold text-emerald-600">
                        {activity.score}%
                      </div>
                    )}
                    {activity.type === 'achievement' && (
                      <Award className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <a 
                  href="/activity" 
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  View all activity →
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Learning Recommendations */}
        <motion.div 
          className="mt-8"
          variants={fadeIn}
          initial="initial"
          animate="animate"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Physics Fundamentals',
                description: 'Master the basics of physics with our adaptive question chain',
                progress: 65,
                questions: 24,
                difficulty: 'Medium'
              },
              {
                title: 'Chemistry Basics',
                description: 'Explore chemical reactions and molecular structures',
                progress: 30,
                questions: 18,
                difficulty: 'Easy'
              },
              {
                title: 'Mathematics Advanced',
                description: 'Challenge yourself with advanced mathematical concepts',
                progress: 0,
                questions: 32,
                difficulty: 'Hard'
              }
            ].map((recommendation, index) => (
              <motion.div 
                key={recommendation.title}
                className="lms-card p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                variants={fadeIn}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    recommendation.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    recommendation.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {recommendation.difficulty}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{recommendation.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{recommendation.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${recommendation.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{recommendation.questions} questions</span>
                    <span>{recommendation.progress > 0 ? 'Continue' : 'Start'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
