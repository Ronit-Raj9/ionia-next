'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Target, 
  TrendingUp, 
  Brain, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Lightbulb
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import toast from 'react-hot-toast';

const features = [
  {
    icon: <Brain className="w-8 h-8 text-blue-600" />,
    title: "AI-Powered Learning",
    description: "Personalized learning paths adapted to each student's unique needs and learning style."
  },
  {
    icon: <Zap className="w-8 h-8 text-yellow-600" />,
    title: "Instant Feedback",
    description: "Real-time grading and feedback to accelerate learning and improve performance."
  },
  {
    icon: <Shield className="w-8 h-8 text-green-600" />,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with 99.9% uptime for uninterrupted learning."
  },
  {
    icon: <Globe className="w-8 h-8 text-purple-600" />,
    title: "Global Access",
    description: "Access your learning materials and progress from anywhere, anytime."
  }
];

const stats = [
  { label: 'Active Learners', value: '10K+', icon: <Users className="w-6 h-6" /> },
  { label: 'Learning Paths', value: '500+', icon: <Target className="w-6 h-6" /> },
  { label: 'Success Rate', value: '95%', icon: <TrendingUp className="w-6 h-6" /> }
];

export default function Home() {
  const router = useRouter();
  const { user } = useRole();

  const handleGetStarted = () => {
    console.log('Get Started clicked!', { user });
    try {
      if (user) {
        // User already has a role, redirect to appropriate dashboard
        console.log('User exists, redirecting to:', user.role);
        redirectToRolePage(user.role);
      } else {
        // Redirect to login page (registration now handled by admins)
        console.log('No user, redirecting to login');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error in handleGetStarted:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const redirectToRolePage = (role: string) => {
    switch (role) {
      case 'superadmin':
        router.push('/superadmin');
        break;
      case 'admin':
        router.push('/admin');
        break;
      case 'teacher':
        router.push('/teacher');
        break;
      case 'student':
        router.push('/student');
        break;
      default:
        router.push('/');
    }
  };

  const handleLearnMore = () => {
    // Scroll to features section
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                The Future of
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                  Education
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Transform learning with AI-powered personalization, instant feedback, and adaptive curriculum designed for the modern classroom.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleLearnMore}
                className="bg-white text-gray-700 border border-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
              >
                <span>Learn More</span>
                <Lightbulb className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mx-auto mb-4">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose IONIA?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the next generation of educational technology with features designed to enhance learning outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students and teachers who are already experiencing the future of education.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">IONIA</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering the future of education through AI and innovation.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}