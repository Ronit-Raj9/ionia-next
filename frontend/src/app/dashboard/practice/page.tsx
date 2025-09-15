"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/features/dashboard/components/card";
import { FiBookOpen, FiTarget, FiTrendingUp, FiClock } from "react-icons/fi";

export default function PracticePage() {
  const router = useRouter();

  const practiceOptions = [
    {
      title: "Mock Tests",
      description: "Take full-length practice tests to simulate real exam conditions",
      icon: FiBookOpen,
      href: "/exam/jee-mains",
      color: "bg-blue-500"
    },
    {
      title: "Subject-wise Practice",
      description: "Practice questions by specific subjects and topics",
      icon: FiTarget,
      href: "/dashboard/material",
      color: "bg-green-500"
    },
    {
      title: "Previous Year Papers",
      description: "Solve questions from previous year examinations",
      icon: FiTrendingUp,
      href: "/exam/jee-advanced",
      color: "bg-purple-500"
    },
    {
      title: "Quick Practice",
      description: "Quick 10-15 minute practice sessions",
      icon: FiClock,
      href: "/dashboard/tests",
      color: "bg-orange-500"
    }
  ];

  const handlePracticeClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Center</h1>
        <p className="text-gray-600">
          Choose your practice mode and improve your performance
        </p>
      </div>

      {/* Practice Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {practiceOptions.map((option, index) => {
          const IconComponent = option.icon;
          return (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 p-6"
              onClick={() => handlePracticeClick(option.href)}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`${option.color} p-3 rounded-full mb-4`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {option.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Practice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tests Completed</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <FiBookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time Spent</p>
              <p className="text-2xl font-bold text-gray-900">0h</p>
            </div>
            <FiClock className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>
    </div>
  );
}
