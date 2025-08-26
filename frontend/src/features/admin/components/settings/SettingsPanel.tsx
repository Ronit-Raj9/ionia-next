"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  KeyIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

interface SettingSection {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

interface SettingsPanelProps {
  className?: string;
}

const settingSections: SettingSection[] = [
  {
    id: 'general',
    name: 'General Settings',
    description: 'Basic platform configuration and preferences',
    icon: CogIcon,
    color: 'blue'
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    description: 'User authentication and data protection settings',
    icon: ShieldCheckIcon,
    color: 'red'
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Email and system notification preferences',
    icon: BellIcon,
    color: 'yellow'
  },
  {
    id: 'content',
    name: 'Content Management',
    description: 'Question and test content policies',
    icon: DocumentTextIcon,
    color: 'green'
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'User roles and permissions',
    icon: UserGroupIcon,
    color: 'purple'
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Data collection and reporting settings',
    icon: ChartBarIcon,
    color: 'indigo'
  },
  {
    id: 'api',
    name: 'API & Integrations',
    description: 'External service integrations and API keys',
    icon: KeyIcon,
    color: 'gray'
  },
  {
    id: 'backup',
    name: 'Backup & Storage',
    description: 'Data backup and cloud storage settings',
    icon: CloudIcon,
    color: 'cyan'
  }
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ className = '' }) => {
  const [activeSection, setActiveSection] = useState<string>('general');

  const renderSectionContent = (sectionId: string) => {
    switch (sectionId) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="IONIA Learning Platform"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Language
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
              </div>
              <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Session Timeout</h4>
                <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
              </div>
              <select className="border border-gray-300 rounded px-3 py-1 text-sm">
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Password Complexity</h4>
                <p className="text-sm text-gray-500">Enforce strong passwords</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Send system notifications via email</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">New User Registration</h4>
                <p className="text-sm text-gray-500">Notify admins of new registrations</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">System Alerts</h4>
                <p className="text-sm text-gray-500">Critical system status notifications</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Settings for this section are coming soon.</p>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      <div className="flex flex-col lg:flex-row">
        {/* Settings Navigation */}
        <div className="lg:w-1/3 border-r border-gray-200">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            <nav className="space-y-2">
              {settingSections.map((section, index) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isActive
                        ? `bg-${section.color}-50 border-${section.color}-200 border`
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${
                        isActive ? `text-${section.color}-600` : 'text-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          isActive ? `text-${section.color}-900` : 'text-gray-900'
                        }`}>
                          {section.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:w-2/3">
          <div className="p-6">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-gray-900">
                  {settingSections.find(s => s.id === activeSection)?.name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {settingSections.find(s => s.id === activeSection)?.description}
                </p>
              </div>

              {renderSectionContent(activeSection)}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Cancel
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;