"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Check, 
  X,
  User,
  Plus,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  email?: string;
  isSelected?: boolean;
}

interface StudentManagementModalProps {
  onClose: () => void;
  classId: string;
  className: string;
  teacherId: string;
  teacherRole: string;
  teacherSchoolId: string;
  currentStudentIds: string[];
  onUpdate: () => void;
}

export default function StudentManagementModal({ 
  onClose, 
  classId,
  className,
  teacherId,
  teacherRole,
  teacherSchoolId,
  currentStudentIds,
  onUpdate
}: StudentManagementModalProps) {
  const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [studentsToAdd, setStudentsToAdd] = useState<string[]>([]);
  const [studentsToRemove, setStudentsToRemove] = useState<string[]>([]);
  const [showAddSection, setShowAddSection] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [classId, teacherSchoolId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Fetch all students from school
      const response = await fetch(`/api/students?role=${teacherRole}&schoolId=${encodeURIComponent(teacherSchoolId)}`);
      const data = await response.json();

      if (data.success) {
        const allStudents = data.data || [];
        
        // Separate current students from available students
        const current = allStudents.filter((s: Student) => currentStudentIds.includes(s.id));
        const available = allStudents.filter((s: Student) => !currentStudentIds.includes(s.id));
        
        setCurrentStudents(current);
        setAvailableStudents(available);
      } else {
        toast.error(data.error || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const toggleAddStudent = (studentId: string) => {
    setStudentsToAdd(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleRemoveStudent = (studentId: string) => {
    setStudentsToRemove(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    if (studentsToAdd.length === 0 && studentsToRemove.length === 0) {
      toast.error('No changes to save');
      return;
    }

    setSaving(true);
    try {
      // First, remove students
      if (studentsToRemove.length > 0) {
        const updatedStudentIds = currentStudentIds.filter(id => !studentsToRemove.includes(id));
        
        const removeResponse = await fetch('/api/classes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: classId,
            teacherId: teacherId,
            studentIds: updatedStudentIds,
            role: teacherRole
          }),
        });

        const removeData = await removeResponse.json();
        if (!removeData.success) {
          throw new Error(removeData.error || 'Failed to remove students');
        }
      }

      // Then, add students
      if (studentsToAdd.length > 0) {
        const addResponse = await fetch('/api/classes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: classId,
            teacherId: teacherId,
            selectedStudents: studentsToAdd.map(id => {
              const student = availableStudents.find(s => s.id === id);
              return {
                id: student?.id,
                name: student?.name,
                email: student?.email
              };
            }),
            role: teacherRole
          }),
        });

        const addData = await addResponse.json();
        if (!addData.success) {
          throw new Error(addData.error || 'Failed to add students');
        }
      }

      toast.success(`Updated ${studentsToAdd.length + studentsToRemove.length} student(s)`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update students');
    } finally {
      setSaving(false);
    }
  };

  const filteredCurrentStudents = currentStudents.filter(student => 
    !studentsToRemove.includes(student.id) &&
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredAvailableStudents = availableStudents.filter(student => 
    studentsToAdd.includes(student.id) ||
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ position: 'fixed' }}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Manage Students
                  </h3>
                  <p className="text-sm text-gray-500">
                    {className}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Add Button */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              {!showAddSection && (
                <button
                  onClick={() => setShowAddSection(true)}
                  className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Students</span>
                </button>
              )}
            </div>

            {/* Content Layout */}
            {showAddSection ? (
              /* Add Students Section */
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Available Students ({availableStudents.length})
                  </h4>
                  <button
                    onClick={() => {
                      setShowAddSection(false);
                      setStudentsToAdd([]);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
                  >
                    <X className="w-4 h-4" />
                    <span>Close</span>
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  ) : filteredAvailableStudents.length === 0 ? (
                    <div className="flex items-center justify-center p-8 text-gray-500">
                      <div className="text-center">
                        <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">
                          {searchTerm ? 'No students found matching your search' : 'No students available to add'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredAvailableStudents.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => toggleAddStudent(student.id)}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              studentsToAdd.includes(student.id)
                                ? 'bg-emerald-600 border-emerald-600'
                                : 'border-gray-300 hover:border-emerald-400'
                            }`}>
                              {studentsToAdd.includes(student.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {student.name}
                              </p>
                              {student.email && (
                                <p className="text-xs text-gray-500 truncate">
                                  {student.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <Plus className={`w-4 h-4 ${
                            studentsToAdd.includes(student.id)
                              ? 'text-emerald-600'
                              : 'text-gray-400'
                          }`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {studentsToAdd.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>{studentsToAdd.length}</strong> student(s) selected to add
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Current Students Section */
              <div className="mb-6">
                <div className="border border-gray-200 rounded-lg">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">
                        Students in Class ({currentStudents.length - studentsToRemove.length})
                      </h4>
                      {studentsToRemove.length > 0 && (
                        <span className="text-xs text-emerald-600 font-medium">
                          {studentsToRemove.length} to remove
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-4">
                    {loading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                      </div>
                    ) : filteredCurrentStudents.length === 0 ? (
                      <div className="flex items-center justify-center p-8 text-gray-500">
                        <div className="text-center">
                          <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No students in this class</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredCurrentStudents.map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {student.name}
                                </p>
                                {student.email && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {student.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleRemoveStudent(student.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                studentsToRemove.includes(student.id)
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600'
                              }`}
                              title="Remove from class"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {showAddSection && studentsToAdd.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>{studentsToAdd.length}</strong> student(s) selected to add
                </p>
              </div>
            )}
            {!showAddSection && studentsToRemove.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900">
                  <strong>{studentsToRemove.length}</strong> student(s) selected to remove
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {showAddSection ? (
                <button
                  onClick={async () => {
                    if (studentsToAdd.length === 0) {
                      toast.error('Please select at least one student to add');
                      return;
                    }
                    
                    setSaving(true);
                    try {
                      const studentsToAddData = availableStudents
                        .filter(s => studentsToAdd.includes(s.id))
                        .map(s => ({
                          id: s.id,
                          name: s.name,
                          email: s.email
                        }));

                      const response = await fetch('/api/classes', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          classId: classId,
                          teacherId: teacherId,
                          selectedStudents: studentsToAddData,
                          role: teacherRole
                        }),
                      });

                      const data = await response.json();

                      if (data.success) {
                        toast.success(`Added ${studentsToAdd.length} student(s)`);
                        setStudentsToAdd([]);
                        setShowAddSection(false);
                        fetchStudents();
                        onUpdate();
                      } else {
                        throw new Error(data.error || 'Failed to add students');
                      }
                    } catch (error) {
                      console.error('Error adding students:', error);
                      toast.error(error instanceof Error ? error.message : 'Failed to add students');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving || studentsToAdd.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add {studentsToAdd.length > 0 ? `${studentsToAdd.length} ` : ''}Student{studentsToAdd.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || studentsToRemove.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Remove {studentsToRemove.length > 0 ? `${studentsToRemove.length} ` : ''}Student{studentsToRemove.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

