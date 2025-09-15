"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiBookOpen, FiTarget, FiTrendingUp, FiUsers, FiAward, FiClock } from "react-icons/fi";

export default function MarketingPage() {
  const router = useRouter();

  const features = [
    {
      icon: FiBookOpen,
      title: "Comprehensive Test Bank",
      description: "Access thousands of practice questions across all subjects"
    },
    {
      icon: FiTarget,
      title: "Mock Tests",
      description: "Simulate real exam conditions with timed practice tests"
    },
    {
      icon: FiTrendingUp,
      title: "Performance Analytics",
      description: "Track your progress with detailed performance insights"
    },
    {
      icon: FiUsers,
      title: "Expert Guidance",
      description: "Get guidance from experienced educators and mentors"
    },
    {
      icon: FiAward,
      title: "Achievement Tracking",
      description: "Monitor your achievements and milestones"
    },
    {
      icon: FiClock,
      title: "Flexible Learning",
      description: "Study at your own pace with flexible scheduling"
    }
  ];

  const examTypes = [
    {
      name: "JEE Mains",
      description: "Prepare for Joint Entrance Examination Mains",
      href: "/exam/jee-mains"
    },
    {
      name: "JEE Advanced",
      description: "Advanced level preparation for JEE Advanced",
      href: "/exam/jee-advanced"
    },
    {
      name: "CUET",
      description: "Common University Entrance Test preparation",
      href: "/exam/cuet"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Master Your
              <span className="text-blue-600"> Exams</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Comprehensive preparation platform for competitive exams with mock tests, 
              practice questions, and detailed analytics to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/register')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started Free
              </button>
              <button
                onClick={() => router.push('/login')}
                className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to excel in your competitive exams
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exam Types Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Prepare for Your Exam
            </h2>
            <p className="text-lg text-gray-600">
              Choose your exam type and start your preparation journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {examTypes.map((exam, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => router.push(exam.href)}
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {exam.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {exam.description}
                </p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Start Preparation
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who have already started their preparation
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
}
