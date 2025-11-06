'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  ArrowRight,
  Brain, 
  Zap, 
  Shield, 
  Globe
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import toast from 'react-hot-toast';

const features = [
  {
    icon: <Brain className="w-6 h-6 text-white" />,
    title: "AI-Powered Learning",
    description: "Personalized learning paths adapted to each student's unique needs."
  },
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    title: "Instant Feedback",
    description: "Real-time grading and feedback to accelerate learning."
  },
  {
    icon: <Shield className="w-6 h-6 text-white" />,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with 99.9% uptime."
  },
  {
    icon: <Globe className="w-6 h-6 text-white" />,
    title: "Global Access",
    description: "Access your learning materials from anywhere, anytime."
  }
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-600 relative">
      {/* Grid Background Pattern - Fixed to cover entire page */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0',
          opacity: 0.3
        }}
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-12 flex justify-center"
          >
            <Image
              src="/ionialogo.png"
              alt="IONIA Logo"
              width={400}
              height={160}
              className="w-auto h-40 md:h-56 lg:h-64 object-contain"
              priority
            />
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto leading-relaxed">
              Transform learning with AI-powered personalization, instant feedback, and adaptive curriculum designed for the modern classroom.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <button
              onClick={handleGetStarted}
              className="bg-white text-emerald-800 px-8 py-3 rounded-lg text-base font-semibold hover:bg-emerald-50 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLearnMore}
              className="bg-transparent text-white border-2 border-white/40 px-8 py-3 rounded-lg text-base font-semibold hover:bg-white/10 hover:border-white/60 transition-all duration-200"
            >
              Learn More
            </button>
          </motion.div>

          {/* Stats - Minimalistic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-20"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">10K+</div>
              <div className="text-sm text-emerald-200">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">500+</div>
              <div className="text-sm text-emerald-200">Learning Paths</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">95%</div>
              <div className="text-sm text-emerald-200">Success Rate</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Minimalistic */}
      <section id="features" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose IONIA?
            </h2>
            <p className="text-lg text-emerald-100 max-w-2xl mx-auto">
              Experience the next generation of educational technology with features designed to enhance learning outcomes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-emerald-100 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Minimalistic */}
      <section className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-lg text-emerald-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students and teachers who are already experiencing the future of education.
            </p>
            <button
              onClick={handleGetStarted}
              className="bg-white text-emerald-800 px-8 py-3 rounded-lg text-base font-semibold hover:bg-emerald-50 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer - Landing Page Only */}
      <footer className="relative z-10 bg-gray-900/80 backdrop-blur-sm text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* LMS Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">LMS</h3>
              <p className="text-sm text-gray-300 mb-4">
                Intelligent Learning Management System with adaptive question chaining for enhanced learning experience.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">
                    Start Learning
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">
                    Track Progress
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-300 hover:text-emerald-400 transition-colors">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-2">
                <li>
                  <span className="text-sm text-gray-300">support@lms.ionia.sbs</span>
                </li>
                <li>
                  <span className="text-sm text-gray-300">+1 (555) 123-4567</span>
                </li>
                <li>
                  <span className="text-sm text-gray-300">Education Hub, Learning City</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-400 mb-4 md:mb-0">
                © 2025 IONIA - Learning Management System. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}