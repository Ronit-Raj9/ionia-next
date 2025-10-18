'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  ArrowLeft,
  School,
  UserCheck,
  Key
} from 'lucide-react';
import SchoolRegistration from '@/components/SchoolRegistration';
import TeacherRegistration from '@/components/TeacherRegistration';
import StudentRegistration from '@/components/StudentRegistration';

type RegistrationType = 'select' | 'school' | 'teacher' | 'student';

export default function RegisterPage() {
  const [registrationType, setRegistrationType] = useState<RegistrationType>('select');

  const handleBack = () => {
    setRegistrationType('select');
  };

  const handleSuccess = (data: any) => {
    // Handle successful registration
    console.log('Registration successful:', data);
  };

  if (registrationType === 'school') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registration Options
          </button>
          <SchoolRegistration onSuccess={handleSuccess} onCancel={handleBack} />
        </div>
      </div>
    );
  }

  if (registrationType === 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registration Options
          </button>
          <TeacherRegistration onSuccess={handleSuccess} onCancel={handleBack} />
        </div>
      </div>
    );
  }

  if (registrationType === 'student') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registration Options
          </button>
          <StudentRegistration onSuccess={handleSuccess} onCancel={handleBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join IONIA Learning Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your registration type to get started with our intelligent learning management system
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {/* School Registration */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all duration-300"
            onClick={() => setRegistrationType('school')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">School Registration</h3>
              <p className="text-gray-600 mb-6">
                Register your school and become an administrator. Set up teacher whitelists and student join codes.
              </p>
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <span>Complete school setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Manage teacher access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-600" />
                  <span>Generate student codes</span>
                </div>
              </div>
              <button className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                Register School
              </button>
            </div>
          </motion.div>

          {/* Teacher Registration */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer border-2 border-transparent hover:border-green-500 transition-all duration-300"
            onClick={() => setRegistrationType('teacher')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Teacher Registration</h3>
              <p className="text-gray-600 mb-6">
                Join as a teacher if your email is whitelisted by your school administrator.
              </p>
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span>Email whitelist verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-green-600" />
                  <span>Join your school</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>Create and manage classes</span>
                </div>
              </div>
              <button className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
                Register as Teacher
              </button>
            </div>
          </motion.div>

          {/* Student Registration */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer border-2 border-transparent hover:border-purple-500 transition-all duration-300"
            onClick={() => setRegistrationType('student')}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Student Registration</h3>
              <p className="text-gray-600 mb-6">
                Join as a student using the join code provided by your school or teacher.
              </p>
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" />
                  <span>Enter school join code</span>
                </div>
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-purple-600" />
                  <span>Join your school</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>Start personalized learning</span>
                </div>
              </div>
              <button className="w-full mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Register as Student
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* How it Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">School Setup</h3>
              <p className="text-gray-600 text-sm">
                School administrators register their institution and set up teacher whitelists and student join codes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Teacher & Student Join</h3>
              <p className="text-gray-600 text-sm">
                Teachers register with whitelisted emails, students join using school-provided codes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Learning</h3>
              <p className="text-gray-600 text-sm">
                Teachers create classes and assignments, students access personalized learning experiences.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <a
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </motion.div>
      </div>
    </div>
  );
}
