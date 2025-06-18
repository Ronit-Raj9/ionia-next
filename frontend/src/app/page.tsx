"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, BookOpen, Brain, BarChart, GraduationCap, LineChart, Users2, BookCheck, Trophy, Target, Sparkles, Zap, Award, CheckCircle, Star } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring", duration: 0.8, bounce: 0.3 }
};

const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { type: "spring", duration: 0.8, bounce: 0.3 }
};

const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { type: "spring", duration: 0.8, bounce: 0.3 }
};

const staggerContainer = {
  animate: {
    transition: {
      type: "spring",
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: "spring", duration: 0.6, bounce: 0.4 }
};

const examTypes = [
  {
    title: 'JEE Mains',
    description: 'Comprehensive practice for JEE Main examination with 10,000+ questions',
    href: '/exam/jee-mains',
    icon: <GraduationCap className="w-8 h-8 mb-4 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    stats: '10K+ Questions'
  },
  {
    title: 'JEE Advanced',
    description: 'Advanced level preparation for IIT entrance with expert solutions',
    href: '/exam/jee-advanced',
    icon: <Trophy className="w-8 h-8 mb-4 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    stats: '5K+ Questions'
  },
  {
    title: 'CUET',
    description: 'Common University Entrance Test preparation with mock tests',
    href: '/exam/cuet',
    icon: <BookCheck className="w-8 h-8 mb-4 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    stats: '8K+ Questions'
  },
  {
    title: 'NEET',
    description: 'Medical entrance exam preparation with detailed analysis',
    href: '/exam/neet',
    icon: <Target className="w-8 h-8 mb-4 text-white" />,
    gradient: 'from-emerald-500 to-teal-600',
    stats: '12K+ Questions'
  },
];

const features = [
  {
    title: 'AI-Powered Analytics',
    description: 'Get personalized insights with our advanced AI that identifies your weak areas and suggests targeted practice',
    icon: <Brain className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Smart Mock Tests',
    description: 'Experience exam-like environment with adaptive difficulty and real-time performance tracking',
    icon: <Zap className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Chapter-wise Mastery',
    description: 'Master every topic with structured learning paths and progress visualization',
    icon: <BookOpen className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Performance Insights',
    description: 'Detailed analytics with comparison charts, improvement graphs, and success predictions',
    icon: <BarChart className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    title: 'Achievement System',
    description: 'Gamified learning with badges, streaks, and leaderboards to keep you motivated',
    icon: <Award className="w-8 h-8 text-yellow-600 group-hover:text-white transition-colors duration-300" />,
    gradient: 'from-emerald-500 to-teal-500'
  },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    quote: 'The AI-powered analytics helped me identify my weak areas and improve my rank significantly!',
    avatar: '👩‍🎓'
  },
  {
    name: 'Rahul Kumar',
    quote: 'Amazing platform! The mock tests were exactly like the real exam. Highly recommended!',
    avatar: '👨‍⚕️'
  },
  {
    name: 'Ananya Gupta',
    quote: 'The chapter-wise practice and detailed explanations made all the difference in my preparation.',
    avatar: '👩‍💼'
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-600 text-white min-h-screen flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/50 via-transparent to-teal-800/50"></div>
        </div>

        {/* Floating Elements */}
        <motion.div 
          className="absolute top-20 left-10 w-20 h-20 bg-emerald-400/20 rounded-full blur-xl"
          animate={{ 
            y: [-20, 20, -20],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-32 h-32 bg-teal-400/20 rounded-full blur-xl"
          animate={{ 
            y: [20, -20, 20],
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-1/4 w-24 h-24 bg-emerald-300/20 rounded-full blur-xl"
          animate={{ 
            x: [-30, 30, -30],
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* <motion.div
              className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-white/10 backdrop-blur-lg border border-white/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Sparkles className="w-5 h-5 text-emerald-300" />
              <span className="text-sm font-medium">Trusted by 50+ students across India</span>
            </motion.div>
             */}
            <motion.h1 
              className="text-6xl md:text-8xl font-extrabold mb-8 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <span className="bg-gradient-to-r from-white via-emerald-100 to-white bg-clip-text text-transparent">
                Enquire
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                Beyond Horizon
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-emerald-50 mb-10 leading-relaxed max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Transform your preparation with AI-powered analytics, smart mock tests, and personalized insights. 
              <br className="hidden md:block" />
              {/* Join thousands of successful students who achieved their dreams with us. */}
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              <Link 
                href="/auth/register"
                className="group relative px-10 py-4 bg-white text-emerald-700 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:bg-emerald-50 hover:scale-105 hover:shadow-2xl"
              >
                <span>Start Free</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </Link>
              {/* <Link 
                href="/demo"
                className="group px-10 py-4 bg-emerald-700/30 backdrop-blur-lg hover:bg-emerald-700/40 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 border border-emerald-400/30"
              >
                <span>Watch Demo</span>
              </Link> */}
            </motion.div>

            {/* Stats Bar */}
            {/* <motion.div 
              className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t border-emerald-400/30"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">50+</div>
                <div className="text-emerald-100 text-sm">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-300">2K+</div>
                <div className="text-emerald-100 text-sm">Questions</div>
              </div>
            </motion.div> */}
          </motion.div>
        </div>
      </section>

      {/* Exam Cards Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_50%)]"></div>
        
        <motion.div 
          className="container mx-auto px-6 relative z-10"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <motion.div className="text-center mb-16" variants={fadeIn}>
            <motion.div 
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700"
              variants={scaleIn}
            >
              <Target className="w-4 h-4" />
              <span className="text-sm font-semibold">Choose Your Path</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Prepare for Your <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Future</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose from our comprehensive range of exam preparations, each tailored with cutting-edge technology
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {examTypes.map((exam, index) => (
              <motion.div 
                key={exam.title}
                variants={fadeIn}
                className="group relative overflow-hidden rounded-3xl hover:shadow-2xl transition-all duration-500 cursor-pointer"
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <Link href={exam.href} className="block">
                  <div className={`bg-gradient-to-br ${exam.gradient} p-8 h-72 flex flex-col justify-between relative`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
                    {/* <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                      {exam.stats}
                    </div> */}
                    
                    <div className="relative z-10">
                      <motion.div
                        initial={{ rotate: 0 }}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {exam.icon}
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-3">{exam.title}</h3>
                      <p className="text-white/90 text-sm leading-relaxed">{exam.description}</p>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="text-white/80 text-sm font-medium">Start Preparation</span>
                      <ArrowRight className="w-5 h-5 text-white transform group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* <motion.div 
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-100 text-blue-700"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Why Choose Us?</span>
            </motion.div> */}
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Experience the <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Future</span> of Learning
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Powered by advanced AI and designed by education experts, our platform offers personalized learning experiences that adapt to your unique needs
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

      {/* Testimonials Section */}
      {/* <section className="py-24 bg-gradient-to-br from-emerald-50 to-teal-50 relative">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Star className="w-4 h-4" />
              <span className="text-sm font-semibold">Success Stories</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Achievers</span> Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands of successful students who transformed their dreams into reality
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={testimonial.name}
                variants={fadeIn}
                className="group p-8 rounded-3xl bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100"
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-2xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section> */}

      {/* Stats Section */}
      {/* <section className="py-20 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center max-w-2xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div variants={scaleIn} className="group">
              <motion.div 
                className="text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent"
                whileHover={{ scale: 1.1 }}
              >
                50+
              </motion.div>
              <div className="text-emerald-200 group-hover:text-white transition-colors">Active Students</div>
            </motion.div>
            <motion.div variants={scaleIn} className="group">
              <motion.div 
                className="text-5xl font-bold mb-2 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent"
                whileHover={{ scale: 1.1 }}
              >
                2K+
              </motion.div>
              <div className="text-emerald-200 group-hover:text-white transition-colors">Practice Questions</div>
            </motion.div>
          </motion.div>
        </div>
      </section> */}

      {/* CTA Section */}
      {/* <section className="py-24 bg-gradient-to-br from-white to-gray-50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"></div>
        
        <motion.div 
          className="container mx-auto px-6 text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <motion.div 
              className="inline-flex items-center gap-2 mb-6 px-6 py-3 rounded-full bg-emerald-100 text-emerald-700"
              variants={scaleIn}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-semibold">Ready to Begin?</span>
            </motion.div>
            
            <motion.h2 
              className="text-4xl md:text-6xl font-bold mb-8 text-gray-900"
              variants={fadeIn}
            >
              Your Success Story <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Starts Here
              </span>
            </motion.h2>
            
            <motion.p 
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
              variants={fadeIn}
            >
              Join thousands of successful students who achieved their dreams with our platform. 
              Start your free trial today and experience the difference.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              variants={fadeIn}
            >
              <Link 
                href="/auth/register"
                className="group relative px-12 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link 
                href="/contact"
                className="group px-12 py-5 border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105"
              >
                Contact Us
              </Link>
            </motion.div>
            
            <motion.div 
              className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500"
              variants={fadeIn}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>14-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Cancel Anytime</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section> */}
    </main>
  );
}