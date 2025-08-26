"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  PencilSquareIcon,
  ChartBarIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

interface QuickAction {
  name: string;
  href: string;
  icon: React.ElementType;
  color: string;
  description?: string;
}

interface QuickActionsProps {
  className?: string;
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    name: 'Create Test',
    href: '/admin/tests/create',
    icon: PlusIcon,
    color: 'blue',
    description: 'Create a new test'
  },
  {
    name: 'Add Questions',
    href: '/admin/questions/add',
    icon: PencilSquareIcon,
    color: 'green',
    description: 'Add new questions'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    color: 'purple',
    description: 'View detailed analytics'
  },
  {
    name: 'Manage Users',
    href: '/admin/users',
    icon: UserGroupIcon,
    color: 'indigo',
    description: 'Manage user accounts'
  }
];

const QuickActions: React.FC<QuickActionsProps> = ({ 
  className = '', 
  actions = defaultActions 
}) => {
  return (
    <motion.div 
      className={`bg-white shadow-sm rounded-xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="px-6 py-5">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
              >
                <Link 
                  href={action.href}
                  className={`inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-${action.color}-600 hover:bg-${action.color}-700 focus:ring-2 focus:ring-offset-2 focus:ring-${action.color}-500 transition-colors duration-200 w-full`}
                  title={action.description}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {action.name}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default QuickActions;