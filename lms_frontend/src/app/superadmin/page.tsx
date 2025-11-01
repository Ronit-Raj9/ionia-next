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
  Ban,
  Unlock,
  Edit,
  X,
  Trash2,
  BookOpen,
  Calendar,
  FileText,
  Snowflake,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BulkStudentCreation from '@/components/BulkStudentCreation';

interface School {
  _id: string;
  schoolId: string;
  schoolName: string;
  schoolType: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  contact?: {
    email: string;
    phone: string;
    website?: string;
  };
  admin: {
    name: string;
    email: string;
  };
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
  };
  status?: 'active' | 'frozen' | 'deleted';
  isDeleted?: boolean;
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
  phoneNumber?: string;
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    role: '',
    status: 'active',
  });
  
  // School users modal state
  const [showSchoolUsersModal, setShowSchoolUsersModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolUsers, setSchoolUsers] = useState<{
    students: UserAccount[];
    admins: UserAccount[];
    teachers: UserAccount[];
  }>({
    students: [],
    admins: [],
    teachers: [],
  });
  const [loadingSchoolUsers, setLoadingSchoolUsers] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<'admins' | 'teachers' | 'students'>('admins');
  const [schoolUsersSearchTerm, setSchoolUsersSearchTerm] = useState('');

  // School classes modal state
  const [showSchoolClassesModal, setShowSchoolClassesModal] = useState(false);
  const [schoolClasses, setSchoolClasses] = useState<any[]>([]);
  const [loadingSchoolClasses, setLoadingSchoolClasses] = useState(false);
  const [classesSearchTerm, setClassesSearchTerm] = useState('');
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<'confirm' | 'type'>('confirm');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Add user to school modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  // School management modal states
  const [showEditSchoolModal, setShowEditSchoolModal] = useState(false);
  const [showFreezeSchoolModal, setShowFreezeSchoolModal] = useState(false);
  const [showDeleteSchoolModal, setShowDeleteSchoolModal] = useState(false);
  const [selectedSchoolForAction, setSelectedSchoolForAction] = useState<School | null>(null);
  const [editSchoolForm, setEditSchoolForm] = useState({
    schoolName: '',
    schoolType: 'CBSE' as 'CBSE' | 'ICSE' | 'State' | 'Private' | 'International' | 'Other',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressPincode: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [processingSchoolAction, setProcessingSchoolAction] = useState(false);

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
        // Include deleted schools for superadmin (they can see everything)
        setSchools(data.data || []);
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
      const response = await fetch(`/api/users`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
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

  const handleBlockUser = async (userId: string, currentStatus: string) => {
    if (!confirm(`Are you sure you want to block this user?`)) {
      return;
    }

    try {
      const status = currentStatus === 'suspended' ? 'suspended' : 'inactive';
      const response = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User blocked successfully`);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User unblocked successfully');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  const handleEditUser = (user: UserAccount) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      status: user.status,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.userId,
          updates: editForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        setSelectedUser(null);
        fetchUsers();
        // Refresh school users if modal is open
        if (selectedSchool) {
          handleViewSchoolUsers(selectedSchool);
        }
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSchoolUsers = async (school: School) => {
    setSelectedSchool(school);
    setLoadingSchoolUsers(true);
    setShowSchoolUsersModal(true);
    setActiveRoleTab('admins');
    setSchoolUsersSearchTerm('');

    try {
      // Fetch all users for this school grouped by role
      const [studentsRes, adminsRes, teachersRes] = await Promise.all([
        fetch(`/api/users?schoolId=${school._id}&role=student`),
        fetch(`/api/users?schoolId=${school._id}&role=admin`),
        fetch(`/api/users?schoolId=${school._id}&role=teacher`),
      ]);

      const studentsData = await studentsRes.json();
      const adminsData = await adminsRes.json();
      const teachersData = await teachersRes.json();

      setSchoolUsers({
        students: studentsData.success ? studentsData.data || [] : [],
        admins: adminsData.success ? adminsData.data || [] : [],
        teachers: teachersData.success ? teachersData.data || [] : [],
      });
    } catch (error) {
      console.error('Error fetching school users:', error);
      toast.error('Failed to fetch school users');
      setSchoolUsers({
        students: [],
        admins: [],
        teachers: [],
      });
    } finally {
      setLoadingSchoolUsers(false);
    }
  };

  const handleViewSchoolClasses = async (school: School) => {
    setSelectedSchool(school);
    setLoadingSchoolClasses(true);
    setShowSchoolClassesModal(true);
    setClassesSearchTerm('');

    try {
      const response = await fetch(
        `/api/classes/school?schoolId=${school._id}&role=superadmin`
      );

      const data = await response.json();

      if (data.success) {
        setSchoolClasses(data.data || []);
      } else {
        toast.error(data.error || 'Failed to fetch school classes');
        setSchoolClasses([]);
      }
    } catch (error) {
      console.error('Error fetching school classes:', error);
      toast.error('Failed to fetch school classes');
      setSchoolClasses([]);
    } finally {
      setLoadingSchoolClasses(false);
    }
  };

  const handleBlockSchoolUser = async (userId: string, currentStatus: string) => {
    if (!confirm(`Are you sure you want to block this user?`)) {
      return;
    }

    try {
      const status = currentStatus === 'suspended' ? 'suspended' : 'inactive';
      const response = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`User blocked successfully`);
        // Refresh school users
        if (selectedSchool) {
          handleViewSchoolUsers(selectedSchool);
        }
      } else {
        toast.error(data.error || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  const handleUnblockSchoolUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User unblocked successfully');
        // Refresh school users
        if (selectedSchool) {
          handleViewSchoolUsers(selectedSchool);
        }
      } else {
        toast.error(data.error || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  const handleEditSchoolUser = (user: UserAccount) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      status: user.status,
    });
    setShowEditModal(true);
  };

  // Filter users based on search term and active tab
  const getFilteredSchoolUsers = () => {
    const users = activeRoleTab === 'admins' ? schoolUsers.admins :
                  activeRoleTab === 'teachers' ? schoolUsers.teachers :
                  schoolUsers.students;

    if (!schoolUsersSearchTerm.trim()) {
      return users;
    }

    const searchLower = schoolUsersSearchTerm.toLowerCase();
    return users.filter(user =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.userId.toLowerCase().includes(searchLower)
    );
  };

  const handleDeleteUser = (user: UserAccount) => {
    setUserToDelete(user);
    setDeleteConfirmationStep('confirm');
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmStep1 = () => {
    if (deleteConfirmationStep === 'confirm') {
      setDeleteConfirmationStep('type');
    }
  };

  const handleDeleteConfirmStep2 = async () => {
    if (!userToDelete) return;

    if (deleteConfirmText.trim().toLowerCase() !== 'delete this user') {
      toast.error('Please type "delete this user" exactly to confirm');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/users?userId=${userToDelete.userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User deleted successfully');
        setShowDeleteModal(false);
        setUserToDelete(null);
        setDeleteConfirmationStep('confirm');
        setDeleteConfirmText('');
        
        // Refresh users list
        fetchUsers();
        
        // Refresh school users if modal is open
        if (selectedSchool) {
          handleViewSchoolUsers(selectedSchool);
        }
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  // School management handlers
  const handleEditSchool = (school: School) => {
    setSelectedSchoolForAction(school);
    setEditSchoolForm({
      schoolName: school.schoolName,
      schoolType: school.schoolType as 'CBSE' | 'ICSE' | 'State' | 'Private' | 'International' | 'Other',
      addressStreet: school.address?.street || '',
      addressCity: school.address?.city || '',
      addressState: school.address?.state || '',
      addressPincode: school.address?.pincode || '',
      contactEmail: school.contact?.email || '',
      contactPhone: school.contact?.phone || '',
    });
    setShowEditSchoolModal(true);
  };

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolForAction) return;

    setProcessingSchoolAction(true);
    try {
      const response = await fetch('/api/schools/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchoolForAction._id,
          updates: {
            schoolName: editSchoolForm.schoolName,
            schoolType: editSchoolForm.schoolType,
            address: {
              street: editSchoolForm.addressStreet,
              city: editSchoolForm.addressCity,
              state: editSchoolForm.addressState,
              pincode: editSchoolForm.addressPincode,
              country: selectedSchoolForAction.address?.country || 'India',
            },
            contact: {
              email: editSchoolForm.contactEmail,
              phone: editSchoolForm.contactPhone,
              website: selectedSchoolForAction.contact?.website,
            },
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('School updated successfully');
        setShowEditSchoolModal(false);
        setSelectedSchoolForAction(null);
        fetchSchools();
      } else {
        toast.error(data.error || 'Failed to update school');
      }
    } catch (error) {
      console.error('Error updating school:', error);
      toast.error('Failed to update school');
    } finally {
      setProcessingSchoolAction(false);
    }
  };

  const handleFreezeSchool = (school: School) => {
    setSelectedSchoolForAction(school);
    setShowFreezeSchoolModal(true);
  };

  const handleFreezeSchoolConfirm = async () => {
    if (!selectedSchoolForAction || !user) return;

    setProcessingSchoolAction(true);
    try {
      const response = await fetch('/api/schools/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          action: 'freezeSchool',
          schoolId: selectedSchoolForAction._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'School frozen successfully');
        setShowFreezeSchoolModal(false);
        setSelectedSchoolForAction(null);
        fetchSchools();
        fetchUsers(); // Refresh users to show status changes
      } else {
        toast.error(data.error || 'Failed to freeze school');
      }
    } catch (error) {
      console.error('Error freezing school:', error);
      toast.error('Failed to freeze school');
    } finally {
      setProcessingSchoolAction(false);
    }
  };

  const handleUnfreezeSchool = async (school: School) => {
    if (!user) return;

    if (!confirm(`Are you sure you want to unfreeze "${school.schoolName}"? All users will be reactivated.`)) {
      return;
    }

    setProcessingSchoolAction(true);
    try {
      const response = await fetch('/api/schools/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          action: 'unfreezeSchool',
          schoolId: school._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'School unfrozen successfully');
        fetchSchools();
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to unfreeze school');
      }
    } catch (error) {
      console.error('Error unfreezing school:', error);
      toast.error('Failed to unfreeze school');
    } finally {
      setProcessingSchoolAction(false);
    }
  };

  const handleDeleteSchool = (school: School) => {
    setSelectedSchoolForAction(school);
    setShowDeleteSchoolModal(true);
  };

  const handleDeleteSchoolConfirm = async () => {
    if (!selectedSchoolForAction || !user) return;

    setProcessingSchoolAction(true);
    try {
      const response = await fetch('/api/schools/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          action: 'deleteSchool',
          schoolId: selectedSchoolForAction._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'School deleted successfully');
        setShowDeleteSchoolModal(false);
        setSelectedSchoolForAction(null);
        fetchSchools();
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete school');
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      toast.error('Failed to delete school');
    } finally {
      setProcessingSchoolAction(false);
    }
  };

  const handleAddUserToSchool = (role: 'admin' | 'teacher' | 'student') => {
    setAddUserForm({
      name: '',
      email: '',
      phoneNumber: '',
    });
    setShowAddUserModal(true);
    // Map role to tab format
    const roleToTab: Record<'admin' | 'teacher' | 'student', 'admins' | 'teachers' | 'students'> = {
      'admin': 'admins',
      'teacher': 'teachers',
      'student': 'students',
    };
    setActiveRoleTab(roleToTab[role]);
  };

  const handleCreateUserForSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) return;

    const targetRole = activeRoleTab === 'admins' ? 'admin' : 
                       activeRoleTab === 'teachers' ? 'teacher' : 'student';

    try {
      setLoading(true);
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUserId: user?._id,
          creatorRole: user?.role,
          creatorSchoolId: user?.schoolId?.toString(),
          targetRole: targetRole,
          targetSchoolId: selectedSchool._id,
          name: addUserForm.name,
          email: addUserForm.email,
          phoneNumber: addUserForm.phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} created successfully!`);
        setGeneratedCredentials(data.data);
        setShowCredentials(true);
        setShowAddUserModal(false);
        setAddUserForm({
          name: '',
          email: '',
          phoneNumber: '',
        });

        // Refresh school users
        if (selectedSchool) {
          handleViewSchoolUsers(selectedSchool);
        }

        // Refresh main users list
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-emerald-600 rounded-xl flex items-center justify-center">
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
                    ? 'border-emerald-500 text-emerald-600'
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
                    ? 'border-emerald-500 text-emerald-600'
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
                    ? 'border-emerald-500 text-emerald-600'
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
                    ? 'border-emerald-500 text-emerald-600'
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
                    ? 'border-emerald-500 text-emerald-600'
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
                    ? 'border-emerald-500 text-emerald-600'
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Schools</p>
                    <p className="text-2xl font-bold text-gray-900">{schools.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Superadmins</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'superadmin').length}
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
                    <p className="text-sm font-medium text-gray-600">Total Admins</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-600" />
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
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <School className="w-5 h-5 text-emerald-600" />
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
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-emerald-700">
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
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value, schoolId: e.target.value === 'superadmin' ? '' : userForm.schoolId })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="superadmin">Superadmin</option>
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

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-700">
                    <strong>Note:</strong> A unique User ID and password will be automatically generated.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-600 hover:from-emerald-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
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
                <div 
                  key={school._id} 
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <School className="w-5 h-5 text-emerald-600" />
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
                        <div>
                          <p className="text-sm text-gray-600">Classes</p>
                          <p className="font-medium text-gray-900">{school.stats.totalClasses}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        school.status === 'frozen' ? 'bg-blue-100 text-blue-800' :
                        school.status === 'deleted' || school.isDeleted ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {school.status === 'frozen' ? 'Frozen' :
                         school.status === 'deleted' || school.isDeleted ? 'Deleted' :
                         'Active'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSchoolUsers(school);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <Users className="w-3.5 h-3.5 mr-1.5" />
                          Users
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSchoolClasses(school);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-emerald-300 shadow-sm text-xs font-medium rounded-md text-emerald-700 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                          Classes
                        </button>
                        {/* Show edit/freeze/delete buttons for all schools except deleted ones */}
                        {(!school.status || school.status !== 'deleted') && !school.isDeleted && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSchool(school);
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              title="Edit School"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1.5" />
                              Edit
                            </button>
                            {school.status === 'frozen' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnfreezeSchool(school);
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                title="Unfreeze School"
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Unfreeze
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFreezeSchool(school);
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                title="Freeze School"
                              >
                                <Snowflake className="w-3.5 h-3.5 mr-1.5" />
                                Freeze
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSchool(school);
                              }}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Delete School"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              Delete
                            </button>
                          </>
                        )}
                      </div>
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
                  <option value="superadmin">Superadmins</option>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                          user.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' :
                          user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                          user.role === 'student' ? 'bg-emerald-100 text-blue-800' :
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleBlockUser(user.userId, user.status)}
                              className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Block User"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnblockUser(user.userId)}
                              className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              title="Unblock User"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
                      <input
                        type="text"
                        readOnly
                        value={generatedCredentials.adminCredentials.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
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
                  </>
                )}

                {generatedCredentials.credentials && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="text"
                        readOnly
                        value={generatedCredentials.credentials.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                      />
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
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  setShowCredentials(false);
                  setGeneratedCredentials(null);
                }}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                I've Saved the Credentials
              </button>
            </motion.div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    disabled={selectedUser.role === 'superadmin'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {selectedUser.role === 'superadmin' && (
                      <option value="superadmin">Superadmin</option>
                    )}
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                  {selectedUser.role === 'superadmin' && (
                    <p className="mt-1 text-xs text-gray-500">Superadmin role cannot be changed</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* School Users Modal */}
        {showSchoolUsersModal && selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-6xl w-full p-6 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{selectedSchool.schoolName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedSchool.schoolId}</p>
                </div>
                <button
                  onClick={() => {
                    setShowSchoolUsersModal(false);
                    setSelectedSchool(null);
                    setSchoolUsers({ students: [], admins: [], teachers: [] });
                    setSchoolUsersSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingSchoolUsers ? (
                <div className="flex items-center justify-center py-12 flex-1">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <span className="ml-3 text-gray-600">Loading users...</span>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Role Tabs */}
                  <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => {
                          setActiveRoleTab('admins');
                          setSchoolUsersSearchTerm('');
                        }}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeRoleTab === 'admins'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admins ({schoolUsers.admins.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveRoleTab('teachers');
                          setSchoolUsersSearchTerm('');
                        }}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeRoleTab === 'teachers'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Teachers ({schoolUsers.teachers.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveRoleTab('students');
                          setSchoolUsersSearchTerm('');
                        }}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                          activeRoleTab === 'students'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Students ({schoolUsers.students.length})</span>
                      </button>
                    </nav>
                  </div>

                  {/* Search Bar and Add Button */}
                  <div className="mb-4 flex items-center space-x-3">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${activeRoleTab}...`}
                        value={schoolUsersSearchTerm}
                        onChange={(e) => setSchoolUsersSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => handleAddUserToSchool(activeRoleTab === 'admins' ? 'admin' : activeRoleTab === 'teachers' ? 'teacher' : 'student')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 whitespace-nowrap"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add {activeRoleTab === 'admins' ? 'Admin' : activeRoleTab === 'teachers' ? 'Teacher' : 'Student'}
                    </button>
                  </div>

                  {/* Users Table */}
                  <div className="flex-1 overflow-auto">
                    {getFilteredSchoolUsers().length > 0 ? (
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">User ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {getFilteredSchoolUsers().map((user) => (
                              <tr key={user._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                                <td className="px-4 py-3 text-sm font-mono text-gray-500">{user.userId}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                                    user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {user.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleEditSchoolUser(user)}
                                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                      title="Edit User"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    {user.status === 'active' ? (
                                      <button
                                        onClick={() => handleBlockSchoolUser(user.userId, user.status)}
                                        className="inline-flex items-center px-2.5 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        title="Block User"
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleUnblockSchoolUser(user.userId)}
                                        className="inline-flex items-center px-2.5 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        title="Unblock User"
                                      >
                                        <Unlock className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      className="inline-flex items-center px-2.5 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                      title="Delete User"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-12 text-center">
                        {activeRoleTab === 'admins' && <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />}
                        {activeRoleTab === 'teachers' && <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />}
                        {activeRoleTab === 'students' && <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />}
                        <p className="text-gray-500 text-lg font-medium">
                          {schoolUsersSearchTerm 
                            ? `No ${activeRoleTab} found matching "${schoolUsersSearchTerm}"`
                            : `No ${activeRoleTab} found for this school`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Summary Footer */}
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-emerald-900">{schoolUsers.admins.length}</p>
                        <p className="text-sm text-emerald-700">Total Admins</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-900">{schoolUsers.teachers.length}</p>
                        <p className="text-sm text-emerald-700">Total Teachers</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-900">{schoolUsers.students.length}</p>
                        <p className="text-sm text-emerald-700">Total Students</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end border-t pt-4">
                <button
                  onClick={() => {
                    setShowSchoolUsersModal(false);
                    setSelectedSchool(null);
                    setSchoolUsers({ students: [], admins: [], teachers: [] });
                    setSchoolUsersSearchTerm('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add User to School Modal */}
        {showAddUserModal && selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Add {activeRoleTab === 'admins' ? 'Admin' : activeRoleTab === 'teachers' ? 'Teacher' : 'Student'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">To: {selectedSchool.schoolName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setAddUserForm({ name: '', email: '', phoneNumber: '' });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUserForSchool} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addUserForm.name}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={addUserForm.phoneNumber}
                    onChange={(e) => setAddUserForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-700">
                    <strong>Note:</strong> A unique User ID and password will be automatically generated for this {activeRoleTab === 'admins' ? 'admin' : activeRoleTab === 'teachers' ? 'teacher' : 'student'}.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUserModal(false);
                      setAddUserForm({ name: '', email: '', phoneNumber: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create {activeRoleTab === 'admins' ? 'Admin' : activeRoleTab === 'teachers' ? 'Teacher' : 'Student'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* School Classes Modal */}
        {showSchoolClassesModal && selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-6xl w-full p-6 my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">Classes</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedSchool.schoolName} ({selectedSchool.schoolId})</p>
                </div>
                <button
                  onClick={() => {
                    setShowSchoolClassesModal(false);
                    setSelectedSchool(null);
                    setSchoolClasses([]);
                    setClassesSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingSchoolClasses ? (
                <div className="flex items-center justify-center py-12 flex-1">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <span className="ml-3 text-gray-600">Loading classes...</span>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search classes by name, teacher, or subject..."
                        value={classesSearchTerm}
                        onChange={(e) => setClassesSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Classes List */}
                  <div className="flex-1 overflow-auto">
                    {schoolClasses
                      .filter((classItem) => {
                        if (!classesSearchTerm.trim()) return true;
                        const searchLower = classesSearchTerm.toLowerCase();
                        return (
                          classItem.className?.toLowerCase().includes(searchLower) ||
                          classItem.teacherName?.toLowerCase().includes(searchLower) ||
                          classItem.subject?.toLowerCase().includes(searchLower) ||
                          classItem.grade?.toLowerCase().includes(searchLower)
                        );
                      })
                      .length > 0 ? (
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Class Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Teacher</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Subject</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Grade</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Students</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Assignments</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Join Code</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {schoolClasses
                              .filter((classItem) => {
                                if (!classesSearchTerm.trim()) return true;
                                const searchLower = classesSearchTerm.toLowerCase();
                                return (
                                  classItem.className?.toLowerCase().includes(searchLower) ||
                                  classItem.teacherName?.toLowerCase().includes(searchLower) ||
                                  classItem.subject?.toLowerCase().includes(searchLower) ||
                                  classItem.grade?.toLowerCase().includes(searchLower)
                                );
                              })
                              .map((classItem) => (
                                <tr key={classItem._id?.toString()} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <BookOpen className="w-4 h-4 text-emerald-600" />
                                      <span className="text-sm font-medium text-gray-900">{classItem.className || 'N/A'}</span>
                                    </div>
                                    {classItem.description && (
                                      <p className="text-xs text-gray-500 mt-1">{classItem.description}</p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <GraduationCap className="w-4 h-4 text-green-600" />
                                      <span className="text-sm text-gray-900">{classItem.teacherName || 'N/A'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-gray-900">{classItem.subject || 'N/A'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-gray-900">{classItem.grade || 'N/A'}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-1">
                                      <Users className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-900">{classItem.studentCount || 0}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-1">
                                      <FileText className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm font-medium text-gray-900">{classItem.recentAssignments || 0}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-emerald-700">
                                      {classItem.joinCode || 'N/A'}
                                    </code>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs text-gray-500">
                                      {classItem.createdAt ? new Date(classItem.createdAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-lg font-medium">
                          {classesSearchTerm
                            ? `No classes found matching "${classesSearchTerm}"`
                            : 'No classes found for this school'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Summary Footer */}
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-emerald-900">{schoolClasses.length}</p>
                        <p className="text-sm text-emerald-700">Total Classes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-900">
                          {schoolClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
                        </p>
                        <p className="text-sm text-emerald-700">Total Students</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-900">
                          {schoolClasses.reduce((sum, c) => sum + (c.recentAssignments || 0), 0)}
                        </p>
                        <p className="text-sm text-emerald-700">Total Assignments</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end border-t pt-4">
                <button
                  onClick={() => {
                    setShowSchoolClassesModal(false);
                    setSelectedSchool(null);
                    setSchoolClasses([]);
                    setClassesSearchTerm('');
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete User Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              {deleteConfirmationStep === 'confirm' ? (
                <>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
                      <p className="text-sm text-gray-600">This action cannot be undone</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> You are about to permanently delete this user:
                    </p>
                    <div className="mt-2 text-sm text-red-900">
                      <p><strong>Name:</strong> {userToDelete.name}</p>
                      <p><strong>Email:</strong> {userToDelete.email}</p>
                      <p><strong>User ID:</strong> {userToDelete.userId}</p>
                      <p><strong>Role:</strong> {userToDelete.role.charAt(0).toUpperCase() + userToDelete.role.slice(1)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setUserToDelete(null);
                        setDeleteConfirmationStep('confirm');
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirmStep1}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Yes, Continue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Final Confirmation</h3>
                      <p className="text-sm text-gray-600">Type "delete this user" to confirm</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800 mb-2">
                      <strong>This is a destructive action!</strong> Deleting this user will permanently remove:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-900 space-y-1">
                      <li>User account and all associated data</li>
                      <li>All submissions and progress records</li>
                      <li>Class enrollments and assignments</li>
                      {userToDelete?.role === 'superadmin' && (
                        <li className="font-bold text-red-900">⚠️ WARNING: Deleting a superadmin will remove system-wide access!</li>
                      )}
                    </ul>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type "delete this user" to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="delete this user"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      autoFocus
                    />
                    {deleteConfirmText.trim().toLowerCase() !== 'delete this user' && deleteConfirmText.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">Text doesn't match. Please type exactly: "delete this user"</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setUserToDelete(null);
                        setDeleteConfirmationStep('confirm');
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirmStep2}
                      disabled={deleting || deleteConfirmText.trim().toLowerCase() !== 'delete this user'}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Deleting...
                        </>
                      ) : (
                        'Delete User Permanently'
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        {/* Edit School Modal */}
        {showEditSchoolModal && selectedSchoolForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit School Details</h3>
                <button
                  onClick={() => {
                    setShowEditSchoolModal(false);
                    setSelectedSchoolForAction(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSchool} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editSchoolForm.schoolName}
                    onChange={(e) => setEditSchoolForm(prev => ({ ...prev, schoolName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Type *
                  </label>
                  <select
                    required
                    value={editSchoolForm.schoolType}
                    onChange={(e) => setEditSchoolForm(prev => ({ ...prev, schoolType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State">State Board</option>
                    <option value="Private">Private</option>
                    <option value="International">International</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={editSchoolForm.addressStreet}
                      onChange={(e) => setEditSchoolForm(prev => ({ ...prev, addressStreet: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={editSchoolForm.addressCity}
                      onChange={(e) => setEditSchoolForm(prev => ({ ...prev, addressCity: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={editSchoolForm.addressState}
                      onChange={(e) => setEditSchoolForm(prev => ({ ...prev, addressState: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      value={editSchoolForm.addressPincode}
                      onChange={(e) => setEditSchoolForm(prev => ({ ...prev, addressPincode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={editSchoolForm.contactEmail}
                      onChange={(e) => setEditSchoolForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editSchoolForm.contactPhone}
                      onChange={(e) => setEditSchoolForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSchoolModal(false);
                      setSelectedSchoolForAction(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingSchoolAction}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingSchoolAction ? 'Updating...' : 'Update School'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Freeze School Confirmation Modal */}
        {showFreezeSchoolModal && selectedSchoolForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Snowflake className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Freeze School</h3>
                  <p className="text-sm text-gray-600">This action will suspend all users and disable all classes</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Warning: This will affect all users in the school</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>All admins, teachers, and students will be suspended</li>
                      <li>All classes will be disabled</li>
                      <li>Users will not be able to log in</li>
                      <li>This action can be reversed by unfreezing the school</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">School Details:</p>
                <p className="text-sm text-gray-700"><strong>Name:</strong> {selectedSchoolForAction.schoolName}</p>
                <p className="text-sm text-gray-700"><strong>ID:</strong> {selectedSchoolForAction.schoolId}</p>
                <p className="text-sm text-gray-700"><strong>Teachers:</strong> {selectedSchoolForAction.stats.totalTeachers}</p>
                <p className="text-sm text-gray-700"><strong>Students:</strong> {selectedSchoolForAction.stats.totalStudents}</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowFreezeSchoolModal(false);
                    setSelectedSchoolForAction(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFreezeSchoolConfirm}
                  disabled={processingSchoolAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingSchoolAction ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Freezing...
                    </>
                  ) : (
                    'Freeze School'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete School Confirmation Modal */}
        {showDeleteSchoolModal && selectedSchoolForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete School</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Danger: This is a permanent action</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>All admins, teachers, and students will be deactivated</li>
                      <li>All classes will be disabled</li>
                      <li>The school will be marked as deleted</li>
                      <li>All data will be preserved but inaccessible</li>
                      <li>This action cannot be reversed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">School Details:</p>
                <p className="text-sm text-gray-700"><strong>Name:</strong> {selectedSchoolForAction.schoolName}</p>
                <p className="text-sm text-gray-700"><strong>ID:</strong> {selectedSchoolForAction.schoolId}</p>
                <p className="text-sm text-gray-700"><strong>Teachers:</strong> {selectedSchoolForAction.stats.totalTeachers}</p>
                <p className="text-sm text-gray-700"><strong>Students:</strong> {selectedSchoolForAction.stats.totalStudents}</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteSchoolModal(false);
                    setSelectedSchoolForAction(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSchoolConfirm}
                  disabled={processingSchoolAction}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingSchoolAction ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Deleting...
                    </>
                  ) : (
                    'Delete School Permanently'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

