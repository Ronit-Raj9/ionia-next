"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Users, 
  Settings, 
  Edit, 
  Trash2, 
  MessageCircle,
  BookOpen,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import StudentSelector from './StudentSelector';

interface ClassInfo {
  _id: string;
  classId: string;
  className: string;
  description?: string;
  participantCount: number;
  messageCount: number;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

interface ClassManagerProps {
  userId: string;
  userName: string;
  role: string;
  schoolId: string;
  onClassSelected: (classId: string) => void;
}

export default function ClassManager({ userId, userName, role, schoolId, onClassSelected }: ClassManagerProps) {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  useEffect(() => {
    if (role === 'teacher') {
      fetchClasses();
    }
  }, [userId, role]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/classes?role=${role}&teacherId=${userId}`);
      const data = await response.json();

      if (data.success) {
        console.log('Fetched classes:', data.data); // Debug log
        // Transform classes to class info
        const classInfo: ClassInfo[] = data.data.map((classData: any) => ({
          _id: classData._id,
          classId: classData._id, // Use _id as classId
          className: classData.className,
          description: '', // Classes don't have description yet
          participantCount: classData.studentIds.length,
          messageCount: 0, // TODO: Get actual message count from class chats
          isActive: true, // Assume all classes are active
          createdAt: classData.createdAt,
          lastActivity: classData.createdAt // Use createdAt as default last activity
        }));
        console.log('Transformed classes:', classInfo); // Debug log
        setClasses(classInfo);
      } else if (data.error?.includes('Database connection')) {
        toast.error('Database connection issue. Using offline mode.');
        setClasses([]);
      } else {
        toast.error('Failed to load classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = () => {
    if (!newClassName.trim()) {
      toast.error('Please enter a class name');
      return;
    }
    setShowCreateForm(false);
    setShowStudentSelector(true);
  };

  const cleanupDemoClasses = async () => {
    try {
      const response = await fetch(`/api/classes/cleanup?teacherId=${userId}&role=${role}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Removed ${data.deletedCount} demo classes`);
        await fetchClasses(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to cleanup demo classes');
      }
    } catch (error) {
      console.error('Error cleaning up demo classes:', error);
      toast.error('Failed to cleanup demo classes');
    }
  };

  const createClassWithStudents = async (selectedStudents: any[]) => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setCreatingClass(true);
    try {
      // Create the class in the database
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          className: newClassName,
          teacherId: userId,
          studentIds: selectedStudents.map(s => s.id),
          description: newClassDescription,
          schoolId: schoolId,
          role: role
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Class "${newClassName}" created successfully with ${selectedStudents.length} students!`);
        setShowStudentSelector(false);
        setNewClassName('');
        setNewClassDescription('');
        await fetchClasses();
      } else {
        toast.error(data.error || 'Failed to create class');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error('Failed to create class');
    } finally {
      setCreatingClass(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatLastActivity = (date: Date | string) => {
    const activityDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - activityDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(date);
  };

  if (role !== 'teacher') {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">Only teachers can manage classes</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Class Management</h2>
          <p className="text-sm text-gray-600">Create and manage your classes</p>
        </div>
        <div className="flex items-center space-x-2">
          {classes.some(c => c.className.toLowerCase().includes('demo')) && (
            <button
              onClick={cleanupDemoClasses}
              className="inline-flex items-center px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
              title="Remove demo classes"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clean Demo
            </button>
          )}
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Class
          </button>
        </div>
      </div>

      {/* Classes List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No classes yet</p>
              <p className="text-sm mb-4">Create your first class to get started</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Class
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((classInfo) => (
              <motion.div
                key={classInfo._id}
                whileHover={{ scale: 1.02 }}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => onClassSelected(classInfo.classId)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {classInfo.className}
                    </h3>
                    {classInfo.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {classInfo.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-gray-700">
                      {classInfo.participantCount} students
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-gray-700">
                      {classInfo.messageCount} messages
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Created {formatDate(classInfo.createdAt)}</span>
                  </div>
                  <span>Active {formatLastActivity(classInfo.lastActivity)}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClassSelected(classInfo.classId);
                    }}
                    className="w-full px-3 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-md hover:bg-emerald-100 transition-colors"
                  >
                    Open Chat
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Form Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ position: 'fixed' }}>
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowCreateForm(false)}
                style={{ position: 'fixed' }}
              ></div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full z-[10000]"
                style={{ position: 'relative', zIndex: 10000 }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Create New Class
                  </h3>
                  
                  <div className="space-y-4">
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
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleCreateClass}
                    disabled={!newClassName.trim()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Continue
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Selector Modal */}
      {showStudentSelector && (
        <StudentSelector
          onStudentsSelected={createClassWithStudents}
          onClose={() => {
            setShowStudentSelector(false);
            setNewClassName('');
            setNewClassDescription('');
          }}
          classId={`class-${Date.now()}`}
          teacherId={userId}
          teacherRole={role}
          teacherSchoolId={schoolId}
          isCreatingClass={true}
        />
      )}

      {/* Loading overlay */}
      {creatingClass && (
        <div className="fixed inset-0 z-[10001] bg-black bg-opacity-50 flex items-center justify-center" style={{ position: 'fixed' }}>
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span className="text-gray-900">Creating class...</span>
          </div>
        </div>
      )}
    </div>
  );
}
