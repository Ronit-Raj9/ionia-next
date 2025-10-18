'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Key, 
  Settings, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  UserPlus,
  Shield
} from 'lucide-react';

interface SchoolAdminDashboardProps {
  userId: string;
}

interface SchoolData {
  _id: string;
  schoolId: string;
  schoolName: string;
  schoolType: string;
  address: any;
  contact: any;
  settings: any;
  teacherEmails: string[];
  studentJoinCode: string;
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
    lastActivity: Date;
  };
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
}

interface SchoolCode {
  _id: string;
  code: string;
  isActive: boolean;
  usedBy: string[];
  maxUses?: number;
  expiresAt?: Date;
  createdAt: Date;
}

export default function SchoolAdminDashboard({ userId }: SchoolAdminDashboardProps) {
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolCodes, setSchoolCodes] = useState<SchoolCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [showAddTeacher, setShowAddTeacher] = useState(false);

  useEffect(() => {
    fetchSchoolData();
  }, [userId]);

  const fetchSchoolData = async () => {
    try {
      const response = await fetch(`/api/schools/manage?userId=${userId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch school data');
      }

      setSchoolData(result.data.school);
      setTeachers(result.data.teachers);
      setStudents(result.data.students);
      setSchoolCodes(result.data.schoolCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch school data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacherEmail = async () => {
    if (!newTeacherEmail.trim()) {
      setError('Email is required');
      return;
    }

    try {
      const response = await fetch('/api/schools/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'addTeacherEmail',
          data: { email: newTeacherEmail.trim() },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add teacher email');
      }

      setSuccess('Teacher email added successfully');
      setNewTeacherEmail('');
      setShowAddTeacher(false);
      fetchSchoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add teacher email');
    }
  };

  const handleRemoveTeacherEmail = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the teacher whitelist?`)) {
      return;
    }

    try {
      const response = await fetch('/api/schools/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'removeTeacherEmail',
          data: { emailToRemove: email },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove teacher email');
      }

      setSuccess('Teacher email removed successfully');
      fetchSchoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove teacher email');
    }
  };

  const handleGenerateNewCode = async () => {
    try {
      const response = await fetch('/api/schools/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'generateNewStudentCode',
          data: {},
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate new code');
      }

      setSuccess('New student join code generated successfully');
      fetchSchoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate new code');
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to deactivate this code?')) {
      return;
    }

    try {
      const response = await fetch('/api/schools/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'deactivateStudentCode',
          data: { codeId },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate code');
      }

      setSuccess('Student join code deactivated successfully');
      fetchSchoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate code');
    }
  };

  const handleToggleStudentRegistration = async (allow: boolean) => {
    try {
      const response = await fetch('/api/schools/manage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'toggleStudentRegistration',
          data: { allowRegistration: allow },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update student registration setting');
      }

      setSuccess(`Student registration ${allow ? 'enabled' : 'disabled'} successfully`);
      fetchSchoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !schoolData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchSchoolData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{schoolData?.schoolName}</h1>
              <p className="text-gray-600">School ID: {schoolData?.schoolId}</p>
            </div>
          </div>
          <button
            onClick={fetchSchoolData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                <p className="text-gray-600">Teachers</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                <p className="text-gray-600">Students</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Key className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{schoolCodes.filter(code => code.isActive).length}</p>
                <p className="text-gray-600">Active Codes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{schoolData?.teacherEmails.length || 0}</p>
                <p className="text-gray-600">Whitelisted Emails</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teacher Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Teacher Management
              </h2>
              <button
                onClick={() => setShowAddTeacher(!showAddTeacher)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Teacher
              </button>
            </div>

            {showAddTeacher && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newTeacherEmail}
                    onChange={(e) => setNewTeacherEmail(e.target.value)}
                    placeholder="teacher@school.com"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTeacherEmail}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddTeacher(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {schoolData?.teacherEmails.map((email, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{email}</span>
                    {teachers.find(t => t.email === email) ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Registered
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveTeacherEmail(email)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Student Join Codes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5" />
                Student Join Codes
              </h2>
              <button
                onClick={handleGenerateNewCode}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Generate New
              </button>
            </div>

            <div className="space-y-3">
              {schoolCodes.map((code) => (
                <div key={code._id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <code className="px-3 py-1 bg-white border rounded-lg font-mono text-lg">
                        {code.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        code.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {code.isActive && (
                        <button
                          onClick={() => handleDeactivateCode(code._id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Used: {code.usedBy.length} times</p>
                    {code.maxUses && <p>Max uses: {code.maxUses}</p>}
                    {code.expiresAt && <p>Expires: {new Date(code.expiresAt).toLocaleDateString()}</p>}
                    <p>Created: {new Date(code.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            School Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Student Registration</h3>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">
                  Allow new student registrations
                </span>
                <button
                  onClick={() => handleToggleStudentRegistration(!schoolData?.settings.allowStudentRegistration)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    schoolData?.settings.allowStudentRegistration
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {schoolData?.settings.allowStudentRegistration ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">School Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Type:</strong> {schoolData?.schoolType}</p>
                <p><strong>Academic Year:</strong> {schoolData?.settings.academicYear}</p>
                <p><strong>Timezone:</strong> {schoolData?.settings.timezone}</p>
                <p><strong>Max Teachers:</strong> {schoolData?.settings.maxTeachers}</p>
                <p><strong>Max Students:</strong> {schoolData?.settings.maxStudents}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
