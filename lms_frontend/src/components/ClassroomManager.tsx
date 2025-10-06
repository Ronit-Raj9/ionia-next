"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Users, 
  Settings, 
  Edit, 
  Trash2, 
  MessageCircle,
  BookOpen,
  Calendar,
  Copy,
  CheckCircle,
  Search,
  Filter,
  BarChart3,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import StudentSelector from './StudentSelector';

interface Classroom {
  _id: string;
  className: string;
  description?: string;
  subject?: string;
  grade?: string;
  teacherMockId: string;
  schoolId: string;
  studentCount: number;
  joinCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  hasUnreadMessages?: boolean;
  recentAssignments?: number;
}

interface ClassroomManagerProps {
  userId: string;
  userName: string;
  role: 'teacher' | 'admin';
  schoolId: string;
  onClassSelected?: (classId: string) => void;
}

export default function ClassroomManager({ userId, userName, role, schoolId, onClassSelected }: ClassroomManagerProps) {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [copiedJoinCode, setCopiedJoinCode] = useState<string | null>(null);

  // Form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, [userId, role, schoolId]);

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/classes/school?schoolId=${schoolId}&role=${role}&mockUserId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setClassrooms(data.data);
      } else {
        toast.error('Failed to load classrooms');
        setClassrooms([]);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      toast.error('Failed to load classrooms');
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) {
      toast.error('Class name is required');
      return;
    }

    if (!schoolId || !schoolId.trim()) {
      toast.error('School ID is required. Please update your profile.');
      return;
    }

    if (!userId || !userId.trim()) {
      toast.error('User ID is missing. Please log out and log back in.');
      return;
    }

    console.log('Creating class with:', {
      teacherId: userId,
      className: newClassName,
      schoolId: schoolId,
      subject: newClassSubject,
      grade: newClassGrade
    });

    setCreatingClass(true);
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: userId,
          className: newClassName.trim(),
          description: newClassDescription.trim() || '',
          subject: newClassSubject || 'General',
          grade: newClassGrade || '',
          schoolId: schoolId.trim(),
          role: role
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Classroom created successfully!');
        setShowCreateForm(false);
        setNewClassName('');
        setNewClassDescription('');
        setNewClassSubject('');
        setNewClassGrade('');
        fetchClassrooms();
      } else {
        console.error('Failed to create classroom:', data);
        toast.error(data.error || 'Failed to create classroom');
      }
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast.error('Failed to create classroom');
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/classes?classId=${classId}&teacherId=${userId}&role=${role}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Classroom deleted successfully');
        fetchClassrooms();
      } else {
        toast.error(data.error || 'Failed to delete classroom');
      }
    } catch (error) {
      console.error('Error deleting classroom:', error);
      toast.error('Failed to delete classroom');
    }
  };

  const copyJoinCode = (joinCode: string) => {
    navigator.clipboard.writeText(joinCode);
    setCopiedJoinCode(joinCode);
    toast.success('Join code copied to clipboard!');
    setTimeout(() => setCopiedJoinCode(null), 2000);
  };

  const filteredClassrooms = classrooms.filter(classroom => {
    const matchesSearch = classroom.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classroom.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || classroom.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const subjects = ['Math', 'Science', 'English', 'History', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classrooms</h2>
          <p className="text-gray-600">Manage your classes and students</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Classroom
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search classrooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredClassrooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassrooms.map((classroom) => (
            <motion.div
              key={classroom._id}
              whileHover={{ scale: 1.02 }}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {classroom.className}
                  </h3>
                  {classroom.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {classroom.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {classroom.subject && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {classroom.subject}
                      </span>
                    )}
                    {classroom.grade && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        Grade {classroom.grade}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyJoinCode(classroom.joinCode)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy join code"
                  >
                    {copiedJoinCode === classroom.joinCode ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classroom._id, classroom.className)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete classroom"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-gray-700">
                    {classroom.studentCount} students
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {classroom.recentAssignments || 0} assignments
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Join Code:</span>
                  <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                    {classroom.joinCode}
                  </code>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/teacher/classroom/${classroom._id}`)}
                  className="flex-1 px-3 py-2 bg-emerald-500 text-white text-sm font-medium rounded-md hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => setSelectedClassroom(classroom)}
                  className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                  title="Manage students"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterSubject ? 'No classrooms found' : 'No classrooms yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterSubject 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first classroom to get started'
            }
          </p>
          {!searchTerm && !filterSubject && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Your First Classroom
            </button>
          )}
        </div>
      )}

      {/* Create Classroom Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create New Classroom</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="e.g., Math Grade 10, Physics Advanced"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    placeholder="Brief description of the class..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={newClassSubject}
                      onChange={(e) => setNewClassSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <select
                      value={newClassGrade}
                      onChange={(e) => setNewClassGrade(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select Grade</option>
                      <option value="9">Grade 9</option>
                      <option value="10">Grade 10</option>
                      <option value="11">Grade 11</option>
                      <option value="12">Grade 12</option>
                      <option value="college">College</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClass}
                  disabled={creatingClass || !newClassName.trim()}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  {creatingClass ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Classroom'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Management Modal */}
      <AnimatePresence>
        {selectedClassroom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Manage Students - {selectedClassroom.className}
                </h3>
              </div>
              
              <div className="p-6">
                <StudentSelector
                  onStudentsSelected={(students) => {
                    // Handle student selection
                    console.log('Selected students:', students);
                    setSelectedClassroom(null);
                  }}
                  onClose={() => setSelectedClassroom(null)}
                  classId={selectedClassroom._id}
                  teacherId={userId}
                  teacherRole={role}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
