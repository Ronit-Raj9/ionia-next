"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, BarChart, GraduationCap, LineChart, Users2, BookCheck, Trophy, Target } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "tween", duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      type: "tween",
      staggerChildren: 0.2
    }
  }
};

const examTypes = [
  {
    title: 'JEE Mains',
    description: 'Comprehensive practice for JEE Main examination',
    href: '/exam/jee-mains',
    icon: <GraduationCap className="w-8 h-8 mb-4 text-emerald-400" />,
  },
  {
    title: 'JEE Advanced',
    description: 'Advanced level preparation for IIT entrance',
    href: '/exam/jee-advanced',
    icon: <Trophy className="w-8 h-8 mb-4 text-emerald-400" />,
  },
  {
    title: 'CUET',
    description: 'Common University Entrance Test preparation',
    href: '/exam/cuet',
    icon: <BookCheck className="w-8 h-8 mb-4 text-emerald-400" />,
  },
  {
    title: 'CBSE',
    description: 'Central Board of Secondary Education',
    href: '/exam/cbse',
    icon: <Target className="w-8 h-8 mb-4 text-emerald-400" />,
  },
];

const features = [
  {
    title: 'Chapter-wise Practice',
    description: 'Practice questions organized by chapters and topics for focused learning',
    icon: <BookOpen className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />,
  },
  {
    title: 'Mock Tests',
    description: 'Full-length tests simulating actual exam environment with timer and analysis',
    icon: <Brain className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />,
  },
  {
    title: 'Detailed Analysis',
    description: 'Get comprehensive performance reports with topic-wise strength analysis',
    icon: <BarChart className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />,
  },
  {
    title: 'Custom Tests',
    description: 'Create personalized tests based on your weak areas and preferences',
    icon: <Target className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />,
  },
  {
    title: 'Performance Tracking',
    description: 'Track your progress with detailed analytics and improvement graphs',
    icon: <LineChart className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />,
  },
  {
    title: 'Expert Support',
    description: '24/7 access to detailed solutions and expert guidance',
    icon: <Users2 className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-800 via-emerald-600 to-emerald-400 text-white overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-block mb-4 px-4 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-sm font-medium">Trusted by 50,000+ students</span>
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Ace Your Entrance Exams
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-emerald-50 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Practice with our comprehensive test series for JEE Mains, Advanced, and CUET.
              <br />Boost your preparation with personalized insights and mock tests.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link 
                href="/auth/register"
                className="group px-8 py-4 bg-white text-emerald-700 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all hover:bg-emerald-50 hover:scale-105"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/about"
                className="px-8 py-4 bg-emerald-700/30 backdrop-blur-sm hover:bg-emerald-700/40 rounded-lg font-semibold transition-all hover:scale-105"
              >
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating Elements */}
        <motion.div 
          className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute -bottom-32 -left-16 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </section>

      {/* Exam Cards Section */}
      <section className="py-20 bg-gray-50">
        <motion.div 
          className="container mx-auto px-4"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Prepare for Your Future</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our comprehensive range of exam preparations tailored to your needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {examTypes.map((exam) => (
              <motion.div 
                key={exam.title}
                variants={fadeIn}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 p-8 hover:shadow-xl transition-all cursor-pointer"
              >
                <Link href={exam.href} className="block">
                  <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {exam.icon}
                  <h3 className="text-2xl font-bold text-white mb-3">{exam.title}</h3>
                  <p className="text-emerald-50">{exam.description}</p>
                  <ArrowRight className="absolute bottom-4 right-4 w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose TestSeries?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience a comprehensive learning platform designed to help you achieve your academic goals
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div 
                key={feature.title}
                variants={fadeIn}
                className="p-6 rounded-xl bg-gray-50 hover:shadow-xl transition-all group"
              >
                <div className="w-14 h-14 rounded-lg bg-emerald-100 flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-emerald-900 text-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeIn} className="p-8 rounded-xl bg-emerald-800/50">
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-emerald-200">Active Students</div>
            </motion.div>
            <motion.div variants={fadeIn} className="p-8 rounded-xl bg-emerald-800/50">
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-emerald-200">Practice Questions</div>
            </motion.div>
            <motion.div variants={fadeIn} className="p-8 rounded-xl bg-emerald-800/50">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-emerald-200">Success Rate</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <motion.div 
          className="container mx-auto px-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Ready to Start Your Journey?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Take the first step toward acing your exams with our platform. Choose your test, start practicing, and track your progress.
          </p>
          <Link 
            href="/auth/register"
            className="inline-block px-8 py-4 bg-emerald-600 text-white rounded-lg font-semibold transition-all hover:bg-emerald-700 hover:scale-105"
          >
            Start Now
          </Link>
        </motion.div>
      </section>
    </main>
  );
} 