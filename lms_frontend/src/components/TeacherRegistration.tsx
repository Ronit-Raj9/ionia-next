'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Building2, CheckCircle, AlertCircle, Search } from 'lucide-react';

interface TeacherRegistrationProps {
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

interface SchoolData {
  schoolId: string;
  schoolName: string;
  schoolType: string;
  address: any;
  contact: any;
  settings: any;
}

export default function TeacherRegistration({ onSuccess, onCancel }: TeacherRegistrationProps) {
  const [step, setStep] = useState<'email' | 'details' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    classId: 'default-class',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationData, setRegistrationData] = useState<any>(null);

  const validateEmail = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/schools/validate-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Email validation failed');
      }

      setSchoolData(result.data);
      setStep('details');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: email,
          role: 'teacher',
          schoolId: schoolData?.schoolId,
          classId: formData.classId,
          phoneNumber: formData.phoneNumber,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      setRegistrationData(result.data);
      setStep('success');
      onSuccess?.(result.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success' && registrationData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Registration Successful!
          </h2>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Welcome to {schoolData?.schoolName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold">{registrationData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{registrationData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-semibold capitalize">{registrationData.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">School</p>
                <p className="font-semibold">{schoolData?.schoolName}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/teacher'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Teacher Dashboard
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'details' && schoolData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Complete Registration</h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">School Information</h3>
            </div>
            <p className="text-blue-700 font-semibold">{schoolData.schoolName}</p>
            <p className="text-blue-600 text-sm">{schoolData.schoolType} • {schoolData.address.city}, {schoolData.address.state}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Class ID
              </label>
              <input
                type="text"
                value={formData.classId}
                onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="default-class"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <User className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Teacher Registration</h1>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">How it works</h2>
          <div className="text-blue-700 text-sm space-y-2">
            <p>1. Enter your email address to check if you're whitelisted by a school</p>
            <p>2. If approved, complete your registration details</p>
            <p>3. Start teaching with access to your school's classes and students</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); validateEmail(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="teacher@school.com"
            />
            <p className="text-sm text-gray-500 mt-1">
              This email must be whitelisted by your school administrator
            </p>
          </div>

          <div className="flex gap-4 justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                'Checking...'
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check Email
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
