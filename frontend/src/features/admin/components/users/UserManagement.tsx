"use client";

import React from 'react';
import { UserList, UserAnalytics } from './index';

const UserManagement: React.FC = () => {
    return (
    <div className="p-6 space-y-6">
      {/* User Analytics */}
                <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
        <UserAnalytics />
            </div>

      {/* User List */}
                <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Users</h2>
        <UserList />
          </div>
    </div>
  );
};

export default UserManagement;
