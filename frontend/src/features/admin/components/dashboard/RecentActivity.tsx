"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ClipboardDocumentListIcon, 
  QuestionMarkCircleIcon, 
  UserGroupIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

interface ActivityItem {
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

interface RecentActivityProps {
  className?: string;
  activities?: ActivityItem[];
}

const defaultActivities: ActivityItem[] = [
  {
    name: 'Tests',
    description: 'View all tests and manage content',
    href: '/admin/tests',
    icon: ClipboardDocumentListIcon,
    color: 'blue'
  },
  {
    name: 'Questions',
    description: 'Review and add new questions',
    href: '/admin/questions',
    icon: QuestionMarkCircleIcon,
    color: 'green'
  },
  {
    name: 'Users',
    description: 'Monitor user activity and roles',
    href: '/admin/users',
    icon: UserGroupIcon,
    color: 'purple'
  }
];

const RecentActivity: React.FC<RecentActivityProps> = ({ 
  className = '', 
  activities = defaultActivities 
}) => {
  return (
    <motion.div 
      className={`bg-white shadow-sm rounded-xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="px-6 py-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div 
                  key={activity.name}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  <Icon className={`h-8 w-8 text-${activity.color}-600 mx-auto mb-2`} />
                  <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                  <Link
                    href={activity.href}
                    className={`mt-2 inline-flex items-center text-${activity.color}-600 hover:text-${activity.color}-500 text-sm`}
                  >
                    Manage {activity.name} <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RecentActivity;