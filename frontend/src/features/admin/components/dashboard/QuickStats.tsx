"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ClipboardDocumentListIcon, 
  QuestionMarkCircleIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { useAdminStore } from '../../store/adminStore';

interface QuickStatItem {
  name: string;
  value: number;
  icon: React.ElementType;
  color: string;
  href: string;
}

interface QuickStatsProps {
  className?: string;
}

const QuickStats: React.FC<QuickStatsProps> = ({ className = '' }) => {
  const { analytics, userAnalytics, loading } = useAdminStore();
  
  const formatValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString();
  };

  const quickStats: QuickStatItem[] = [
    { 
      name: 'Total Tests', 
      value: analytics?.totalTests ?? 0, 
      icon: ClipboardDocumentListIcon,
      color: 'blue',
      href: '/admin/tests'
    },
    { 
      name: 'Total Questions', 
      value: analytics?.totalQuestions ?? 0, 
      icon: QuestionMarkCircleIcon,
      color: 'green',
      href: '/admin/questions'
    },
    { 
      name: 'Active Users', 
      value: analytics?.activeUsers ?? 0, 
      icon: UserGroupIcon,
      color: 'purple',
      href: '/admin/users'
    },
    { 
      name: 'Total Students', 
      value: analytics?.totalStudents ?? 0, 
      icon: AcademicCapIcon,
      color: 'indigo',
      href: '/admin/users'
    }
  ];

  const isLoading = loading.has('analytics') || loading.has('userAnalytics');

  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {quickStats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link
              href={stat.href}
              className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-lg bg-${stat.color}-100 p-3`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} aria-hidden="true" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatValue(stat.value)}
                    </p>
                  )}
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};

export default QuickStats;