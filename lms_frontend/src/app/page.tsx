"use client";

import React from 'react';
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

  const handleGetStarted = () => {
    router.push('/auth/register');
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
                className="lms-button text-lg px-8 py-4 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleLearnMore}
                className="lms-button-secondary text-lg px-8 py-4 rounded-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200"
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
    </div>
  );
}
