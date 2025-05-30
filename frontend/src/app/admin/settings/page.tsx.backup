"use client";

import { useState } from 'react';
import { 
  BellIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";

// Define interface for notifications with index signature
interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  testReminders: boolean;
  [key: string]: boolean;
}

// Define interface for security settings with index signature
interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  [key: string]: boolean | number;
}

// Define interface for platform settings with index signature
interface PlatformSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  defaultTimeLimit: number;
  [key: string]: boolean | number;
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    testReminders: true,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
  });

  const [platform, setPlatform] = useState<PlatformSettings>({
    maintenanceMode: false,
    allowRegistration: true,
    defaultTimeLimit: 60,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-green-800">Platform Settings</h1>
        <p className="mt-1 text-sm text-green-600">
          Manage your platform configurations and preferences.
        </p>
      </div>

      {/* Notification Settings */}
      <div className="bg-white shadow rounded-lg border border-green-100">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <BellIcon className="h-6 w-6 text-green-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-green-800">Notification Settings</h3>
          </div>
          <div className="mt-5 space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-green-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                  className={`${
                    value ? 'bg-green-600' : 'bg-green-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      value ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white shadow rounded-lg border border-green-100">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-green-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-green-800">Security Settings</h3>
          </div>
          <div className="mt-5 space-y-4">
            {Object.entries(security).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-green-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                </div>
                {typeof value === 'boolean' ? (
                  <button
                    onClick={() => setSecurity(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`${
                      value ? 'bg-green-600' : 'bg-green-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        value ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                ) : (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setSecurity(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    className="block w-20 rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-white shadow rounded-lg border border-green-100">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <Cog6ToothIcon className="h-6 w-6 text-green-500 mr-2" />
            <h3 className="text-lg font-medium leading-6 text-green-800">Platform Settings</h3>
          </div>
          <div className="mt-5 space-y-4">
            {Object.entries(platform).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-green-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                </div>
                {typeof value === 'boolean' ? (
                  <button
                    onClick={() => setPlatform(prev => ({ ...prev, [key]: !prev[key] }))}
                    className={`${
                      value ? 'bg-green-600' : 'bg-green-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        value ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                ) : (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setPlatform(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    className="block w-20 rounded-md border-green-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
} 