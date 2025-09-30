"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Users,
  BookOpen,
  Calendar,
  Plus,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AvailableClass {
  _id: string;
  className: string;
  description?: string;
  subject?: string;
  grade?: string;
  teacherMockId: string;
  studentCount: number;
  joinCode: string;
  createdAt: string;
}

interface ClassDiscoveryProps {
  studentId: string;
  schoolId: string;
  onClassJoined?: (classId: string) => void;
}

export default function ClassDiscovery({ studentId, schoolId, onClassJoined }: ClassDiscoveryProps) {
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  useEffect(() => {
    fetchAvailableClasses();
  }, [studentId, schoolId]);

  const fetchAvailableClasses = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/classes/available?schoolId=${schoolId}&studentId=${studentId}&role=student`);
      const data = await response.json();

      if (data.success) {
        setAvailableClasses(data.data);
      } else {
        toast.error('Failed to load available classes');
        setAvailableClasses([]);
      }
    } catch (error) {
      console.error('Error fetching available classes:', error);
      toast.error('Failed to load available classes');
      setAvailableClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (classId: string, className: string) => {
    setJoining(classId);
    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          joinCode: availableClasses.find(c => c._id === classId)?.joinCode,
          studentId: studentId,
          schoolId: schoolId,
          role: 'student'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully joined ${className}!`);
        onClassJoined?.(classId);
        fetchAvailableClasses(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to join class');
      }
    } catch (error) {
      console.error('Error joining class:', error);
      toast.error('Failed to join class');
    } finally {
      setJoining(null);
    }
  };

  const filteredClasses = availableClasses.filter(classData => {
    const matchesSearch = classData.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classData.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || classData.subject === filterSubject;
    const matchesGrade = !filterGrade || classData.grade === filterGrade;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const subjects = ['Math', 'Science', 'English', 'History', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
  const grades = ['9', '10', '11', '12', 'college'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discover Classes</h2>
          <p className="text-gray-600">Join classes available in your school</p>
        </div>
        <button
          onClick={fetchAvailableClasses}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search classes..."
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
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Grades</option>
          {grades.map(grade => (
            <option key={grade} value={grade}>Grade {grade}</option>
          ))}
        </select>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classData) => (
            <motion.div
              key={classData._id}
              whileHover={{ scale: 1.02 }}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {classData.className}
                </h3>
                {classData.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {classData.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {classData.subject && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {classData.subject}
                    </span>
                  )}
                  {classData.grade && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      Grade {classData.grade}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-gray-700">
                    {classData.studentCount} students
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {new Date(classData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Teacher:</span>
                  <span className="text-sm font-medium">
                    {classData.teacherMockId.replace('teacher', 'Teacher ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleJoinClass(classData._id, classData.className)}
                disabled={joining === classData._id}
                className="w-full px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-md hover:bg-emerald-600 disabled:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                {joining === classData._id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Join Class</span>
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterSubject || filterGrade ? 'No classes found' : 'No available classes'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterSubject || filterGrade 
              ? 'Try adjusting your search or filter criteria'
              : 'There are no classes available to join at the moment. Check back later or ask your teacher to create a class.'
            }
          </p>
          {(searchTerm || filterSubject || filterGrade) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSubject('');
                setFilterGrade('');
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

