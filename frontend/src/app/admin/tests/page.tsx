"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { TestList } from '@/features/admin/components/tests';
import { useTestStore } from '@/features/admin/store/testStore';

export default function AdminTestsPage() {
  const { fetchTests } = useTestStore();

  useEffect(() => {
    // Load tests when the page loads
    fetchTests();
  }, [fetchTests]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Test Management</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Create, manage, and organize tests and assessments
          </p>
        </div>
        <Link
          href="/admin/tests/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Test
        </Link>
      </div>
      <TestList />
    </div>
  );
}