"use client";

import React from 'react';
import { SettingsPanel } from '@/features/admin/components/settings';

export default function AdminSettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Configure platform settings and preferences
        </p>
      </div>
      <SettingsPanel />
    </div>
  );
}