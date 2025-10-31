"use client";

import React, { useState, useEffect } from 'react';
import { useRole, hasPermission } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  UserPlus,
  School,
  GraduationCap,
  Shield,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Settings,
  Search,
  Filter,
  UsersRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BulkStudentCreation from '@/components/BulkStudentCreation';

interface School {
  _id: string;
  schoolId: string;
  schoolName: string;
  schoolType: string;
  admin: {
    name: string;
    email: string;
  };
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
  };
  createdAt: Date;
}

interface UserAccount {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  status: string;
  createdAt: Date;
}

type TabType = 'overview' | 'create-school' | 'create-user' | 'bulk-students' | 'schools' | 'users';

export default function SuperadminDashboard() {
  const { user } = useRole();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Form states
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<any>(null);

  // School form
  const [schoolForm, setSchoolForm] = useState({
    schoolName: '',
    schoolType: 'CBSE',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressPincode: '',
    contactEmail: '',
    contactPhone: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });

  // User form
  const [userForm, setUserForm] = useState({
    role: 'admin',
    schoolId: '',
    name: '',
    email: '',
    phoneNumber: '',
  });

  // Check if user is superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      toast.error('Access denied. Superadmin privileges required.');
      router.push('/');
      return;
    }

    if (user) {
      fetchSchools();
      fetchUsers();
    }
  }, [user, router]);

  const fetchSchools = async () => {
    try {
      const response = await fetch(`/api/schools/create?role=superadmin`);
      const data = await response.json();

      if (data.success) {
        setSchools(data.data);
      } else {
        toast.error('Failed to fetch schools');
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Failed to fetch schools');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users/create?role=superadmin`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/schools/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUserId: user?._id,
          creatorRole: user?.role,
          schoolName: schoolForm.schoolName,
          schoolType: schoolForm.schoolType,
          address: {
            street: schoolForm.addressStreet,
            city: schoolForm.addressCity,
            state: schoolForm.addressState,
            pincode: schoolForm.addressPincode,
          },
          contact: {
            email: schoolForm.contactEmail,
            phone: schoolForm.contactPhone,
          },
          adminName: schoolForm.adminName,
          adminEmail: schoolForm.adminEmail,
          adminPhone: schoolForm.adminPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('School created successfully!');
        setGeneratedCredentials(data.data);
        setShowCredentials(true);
        
        // Reset form
        setSchoolForm({
          schoolName: '',
          schoolType: 'CBSE',
          addressStreet: '',
          addressCity: '',
          addressState: '',
          addressPincode: '',
          contactEmail: '',
          contactPhone: '',
          adminName: '',
          adminEmail: '',
          adminPhone: '',
        });

        // Refresh schools list
        fetchSchools();
      } else {
        toast.error(data.error || 'Failed to create school');
      }
    } catch (error) {
      console.error('Error creating school:', error);
      toast.error('Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUserId: user?._id,
          creatorRole: user?.role,
          creatorSchoolId: user?.schoolId?.toString(),
          targetRole: userForm.role,
          targetSchoolId: userForm.schoolId,
          name: userForm.name,
          email: userForm.email,
          phoneNumber: userForm.phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${userForm.role.charAt(0).toUpperCase() + userForm.role.slice(1)} created successfully!`);
        setGeneratedCredentials(data.data);
        setShowCredentials(true);

        // Reset form
        setUserForm({
          role: 'admin',
          schoolId: '',
          name: '',
          email: '',
          phoneNumber: '',
        });

        // Refresh users list
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.userId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need superadmin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Superadmin Dashboard
              </h1>
              <p className="text-gray-600">
                Manage schools, users, and system-wide settings
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('create-school')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create-school'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-2" />
                Create School
              </button>
              <button
                onClick={() => setActiveTab('create-user')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create-user'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Create User
              </button>
              <button
                onClick={() => setActiveTab('bulk-students')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bulk-students'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Bulk Students
              </button>
              <button
                onClick={() => setActiveTab('schools')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'schools'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <School className="w-4 h-4 inline mr-2" />
                All Schools ({schools.length})
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                All Users ({users.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Schools</p>
                    <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Admins</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'teacher').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'student').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Schools */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Schools</h2>
              <div className="space-y-3">
                {schools.slice(0, 5).map((school) => (
                  <div key={school._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <School className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{school.schoolName}</h3>
                        <p className="text-sm text-gray-500">{school.schoolType} • {school.admin.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {school.stats.totalTeachers} teachers • {school.stats.totalStudents} students
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(school.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create School Tab */}
        {activeTab === 'create-school' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New School</h2>
              
              <form onSubmit={handleCreateSchool} className="space-y-6">
                {/* School Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">School Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={schoolForm.schoolName}
                        onChange={(e) => setSchoolForm({ ...schoolForm, schoolName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Delhi Public School"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Type *
                      </label>
                      <select
                        required
                        value={schoolForm.schoolType}
                        onChange={(e) => setSchoolForm({ ...schoolForm, schoolType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="State">State Board</option>
                        <option value="International">International</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={schoolForm.contactEmail}
                        onChange={(e) => setSchoolForm({ ...schoolForm, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="school@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={schoolForm.contactPhone}
                        onChange={(e) => setSchoolForm({ ...schoolForm, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={schoolForm.addressStreet}
                        onChange={(e) => setSchoolForm({ ...schoolForm, addressStreet: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={schoolForm.addressCity}
                        onChange={(e) => setSchoolForm({ ...schoolForm, addressCity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Delhi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        required
                        value={schoolForm.addressState}
                        onChange={(e) => setSchoolForm({ ...schoolForm, addressState: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Delhi"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        required
                        value={schoolForm.addressPincode}
                        onChange={(e) => setSchoolForm({ ...schoolForm, addressPincode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="110001"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">School Admin Details</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> A unique User ID and password will be automatically generated for the admin.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={schoolForm.adminName}
                        onChange={(e) => setSchoolForm({ ...schoolForm, adminName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={schoolForm.adminEmail}
                        onChange={(e) => setSchoolForm({ ...schoolForm, adminEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="admin@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Phone
                      </label>
                      <input
                        type="tel"
                        value={schoolForm.adminPhone}
                        onChange={(e) => setSchoolForm({ ...schoolForm, adminPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating School...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-5 h-5" />
                      Create School & Admin
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Create User Tab */}
        {activeTab === 'create-user' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New User</h2>
              
              <form onSubmit={handleCreateUser} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Role *
                  </label>
                  <select
                    required
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>

                {userForm.role !== 'superadmin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School *
                    </label>
                    <select
                      required
                      value={userForm.schoolId}
                      onChange={(e) => setUserForm({ ...userForm, schoolId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select a school</option>
                      {schools.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.schoolName} ({school.schoolId})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Jane Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userForm.phoneNumber}
                    onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> A unique User ID and password will be automatically generated.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create {userForm.role.charAt(0).toUpperCase() + userForm.role.slice(1)}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Students Tab */}
        {activeTab === 'bulk-students' && (
          <div className="max-w-6xl mx-auto">
            {schools.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schools Available</h3>
                <p className="text-gray-600 mb-4">
                  You need to create at least one school before creating students in bulk.
                </p>
                <button
                  onClick={() => setActiveTab('create-school')}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Create School First
                </button>
              </div>
            ) : (
              <>
                {/* School Selector */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select School *
                  </label>
                  <select
                    value={userForm.schoolId}
                    onChange={(e) => setUserForm({ ...userForm, schoolId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Choose a school for these students</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id}>
                        {school.schoolName} ({school.schoolId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bulk Creation Component */}
                {userForm.schoolId ? (
                  <BulkStudentCreation
                    adminUserId={user?._id || ''}
                    adminRole="superadmin"
                    schoolId={userForm.schoolId}
                    onComplete={fetchUsers}
                  />
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Please select a school above to start creating students</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Schools List Tab */}
        {activeTab === 'schools' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">All Schools</h2>
            
            <div className="space-y-4">
              {schools.map((school) => (
                <div key={school._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <School className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{school.schoolName}</h3>
                          <p className="text-sm text-gray-500">{school.schoolId}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">School Type</p>
                          <p className="font-medium text-gray-900">{school.schoolType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Admin</p>
                          <p className="font-medium text-gray-900">{school.admin.name}</p>
                          <p className="text-xs text-gray-500">{school.admin.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Teachers</p>
                          <p className="font-medium text-gray-900">{school.stats.totalTeachers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Students</p>
                          <p className="font-medium text-gray-900">{school.stats.totalStudents}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(school.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {schools.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No schools created yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users List Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="teacher">Teachers</option>
                  <option value="student">Students</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{user.userId}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                          user.role === 'student' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No users found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credentials Modal */}
        {showCredentials && generatedCredentials && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Account Created Successfully!</h3>
                  <p className="text-sm text-gray-600">Save these credentials securely</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> This is the only time you'll see the password. 
                    Make sure to save it securely before closing this dialog.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {generatedCredentials.adminCredentials && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin User ID</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedCredentials.adminCredentials.userId}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedCredentials.adminCredentials.userId)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Password</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedCredentials.adminCredentials.password}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedCredentials.adminCredentials.password)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                      <input
                        type="text"
                        readOnly
                        value={generatedCredentials.adminCredentials.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                    </div>
                  </>
                )}

                {generatedCredentials.credentials && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedCredentials.credentials.userId}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedCredentials.credentials.userId)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedCredentials.credentials.password}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedCredentials.credentials.password)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="text"
                        readOnly
                        value={generatedCredentials.credentials.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setShowCredentials(false);
                  setGeneratedCredentials(null);
                }}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                I've Saved the Credentials
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

