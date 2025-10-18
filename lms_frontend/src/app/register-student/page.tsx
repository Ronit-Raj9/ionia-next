"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterStudent() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    schoolId: '', // Will be set by user
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.schoolId.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: 'student',
          schoolId: formData.schoolId,
          classId: 'default-class'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Student ${formData.name} registered successfully!`);
        setFormData({ name: '', email: '', schoolId: 'demo-school-delhi-2025' });
      } else {
        if (data.error.includes('already exists')) {
          toast.error('A student with this email already exists');
        } else {
          toast.error(data.error || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateSampleStudents = async () => {
    const sampleStudents = [
      { name: 'Alice Johnson', email: 'alice.johnson@demo.com' },
      { name: 'Bob Smith', email: 'bob.smith@demo.com' },
      { name: 'Carol Davis', email: 'carol.davis@demo.com' },
      { name: 'David Wilson', email: 'david.wilson@demo.com' },
      { name: 'Emma Brown', email: 'emma.brown@demo.com' },
    ];

    setLoading(true);
    let successCount = 0;

    for (const student of sampleStudents) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: student.name,
            email: student.email,
            role: 'student',
            schoolId: formData.schoolId,
            classId: 'default-class'
          })
        });

        const data = await response.json();
        if (data.success) {
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to register ${student.name}:`, error);
      }
    }

    setLoading(false);
    toast.success(`Successfully registered ${successCount} sample students!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Register New Student
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School ID *
            </label>
            <input
              type="text"
              value={formData.schoolId}
              onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
              placeholder="Enter school ID"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Must match teacher's school ID exactly (case-sensitive)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter student's full name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter student's email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Registering...' : 'Register Student'}
            </button>

            <button
              type="button"
              onClick={generateSampleStudents}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Creating...' : 'Create 5 Sample Students'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Home
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Quick Access:</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Note:</strong> Contact your teacher for login credentials</p>
            <p><strong>School ID:</strong> Contact your school administrator</p>
            <p><strong>Debug Page:</strong> <a href="/debug-flow" className="text-blue-600 hover:underline">/debug-flow</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
