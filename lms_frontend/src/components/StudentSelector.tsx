"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Check, 
  X,
  User,
  Crown
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  email?: string;
  isSelected: boolean;
  userId?: string; // New system user ID
  role?: string; // New system role
  classId?: string; // New system class ID
}

interface Class {
  _id: string;
  className: string;
  teacherId: string; // Teacher ID from new system
  studentIds: string[]; // Student IDs from new system
  createdAt: string;
}

interface StudentSelectorProps {
  onStudentsSelected: (students: Student[], selectedClass?: Class) => void;
  onClose: () => void;
  classId: string;
  teacherId: string;
  teacherRole: string;
  teacherSchoolId: string; // New prop for school filtering
  isCreatingClass?: boolean; // New prop for class creation mode
}

export default function StudentSelector({ onStudentsSelected, onClose, classId, teacherId, teacherRole, teacherSchoolId, isCreatingClass = false }: StudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);
  const [step, setStep] = useState<'selectClass' | 'selectStudents'>('selectClass');

  useEffect(() => {
    if (isCreatingClass) {
      // Skip class selection, go directly to student selection
      setStep('selectStudents');
      fetchAllStudents();
    } else {
      fetchTeacherClasses();
    }
  }, [teacherId, teacherRole, isCreatingClass]);

  const fetchTeacherClasses = async () => {
    setClassesLoading(true);
    try {
      const response = await fetch(`/api/classes?role=${teacherRole}&teacherId=${teacherId}`);
      const data = await response.json();

      if (data.success) {
        setClasses(data.data);
        if (data.data.length === 0) {
          toast('No classes found. Create a class first.', { icon: 'ℹ️' });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes');
      setClasses([]);
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchAllStudents = async () => { // New function for class creation
    setLoading(true);
    try {
      const response = await fetch(`/api/students?role=${teacherRole}&schoolId=${encodeURIComponent(teacherSchoolId)}`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.data || []);
        if (data.message) {
          toast(data.message, { icon: 'ℹ️' });
        }
      } else {
        console.error('Failed to fetch students:', data.error);
        toast.error(data.error || 'Failed to load students');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students. Please check your connection.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsFromClass = async (selectedClassData: Class) => {
    setLoading(true);
    try {
      console.log('Fetching students for class:', selectedClassData.className);
      console.log('Class student IDs:', selectedClassData.studentIds);
      
      // First get all available students from the same school
      const response = await fetch(`/api/students?role=${teacherRole}&schoolId=${encodeURIComponent(teacherSchoolId)}`);
      const data = await response.json();

      if (data.success) {
        // If we're creating a class, show all students from the school
        // If we're managing an existing class, filter to show only students in that class
        let studentsToShow = data.data;
        
        if (!isCreatingClass) {
          // Filter students to only show those in the selected class
          studentsToShow = data.data.filter((student: any) => {
            const isInClass = selectedClassData.studentIds.includes(student.id);
            return isInClass;
          });
        }
        
        // If no students match and we're not creating a class, use the class's student IDs to create entries
        if (studentsToShow.length === 0 && selectedClassData.studentIds.length > 0 && !isCreatingClass) {
          console.log('No matching students found, creating from class IDs');
          const fallbackStudents: Student[] = selectedClassData.studentIds.map((id) => {
            // Try to find the student in the full list
            const foundStudent = data.data.find((s: any) => s.id === id);
            if (foundStudent) {
              return { ...foundStudent, isSelected: false };
            }
            return {
              id,
              name: id.replace(/_/g, ' ').replace(/student/i, 'Student '),
              email: `${id}@student.com`,
              isSelected: false
            };
          });
          setStudents(fallbackStudents);
        } else {
          setStudents(studentsToShow);
        }
        
        if (data.fallback) {
          toast('Using default students (database connection issue)', { icon: 'ℹ️' });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      
      // Fallback to class students
      const fallbackStudents: Student[] = selectedClassData.studentIds.map((id) => ({
        id,
        name: id.replace(/_/g, ' ').replace(/student/i, 'Student '),
        email: `${id}@student.com`,
        isSelected: false
      }));
      setStudents(fallbackStudents);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setStudents(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, isSelected: !student.isSelected }
          : student
      )
    );
  };

  const selectAll = () => {
    const filteredStudents = getFilteredStudents();
    const allSelected = filteredStudents.every(s => s.isSelected);
    
    setStudents(prev => 
      prev.map(student => 
        filteredStudents.some(fs => fs.id === student.id)
          ? { ...student, isSelected: !allSelected }
          : student
      )
    );
  };

  const selectEntireClass = () => {
    setStudents(prev => 
      prev.map(student => ({ ...student, isSelected: true }))
    );
  };

  const clearSelection = () => {
    setStudents(prev => 
      prev.map(student => ({ ...student, isSelected: false }))
    );
  };

  const getFilteredStudents = () => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getSelectedStudents = () => {
    return students.filter(student => student.isSelected);
  };

  const handleClassSelection = async (classData: Class) => {
    setSelectedClass(classData);
    setStep('selectStudents');
    await fetchStudentsFromClass(classData);
  };

  const handleEntireClassSelection = async () => {
    if (!selectedClass) return;
    
    // Check if we have students loaded
    if (students.length === 0) {
      // If no students loaded yet, fetch them first
      await fetchStudentsFromClass(selectedClass);
      // Wait a tiny bit for state to update
      setTimeout(() => {
        setStudents(prev => prev.map(student => ({ ...student, isSelected: true })));
        const allStudents = students.map(student => ({ ...student, isSelected: true }));
        if (allStudents.length > 0) {
          onStudentsSelected(allStudents, selectedClass);
        }
      }, 200);
    } else {
      // Select all students in the class
      const allStudents = students.map(student => ({ ...student, isSelected: true }));
      setStudents(allStudents);
      // Immediately confirm with all students selected
      onStudentsSelected(allStudents, selectedClass);
    }
  };

  const handleBackToClasses = () => {
    setStep('selectClass');
    setSelectedClass(null);
    setStudents([]);
    setSearchTerm('');
  };

  const handleConfirm = () => {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    onStudentsSelected(selectedStudents, selectedClass || undefined);
  };

  const filteredStudents = getFilteredStudents();
  const selectedCount = getSelectedStudents().length;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ position: 'fixed' }}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {isCreatingClass ? 'Select Students for New Class' : 
                     step === 'selectClass' ? 'Select Class' : 'Select Students'}
                  </h3>
                  {step === 'selectStudents' && selectedClass && !isCreatingClass && (
                    <p className="text-sm text-gray-500">
                      From: {selectedClass.className}
                    </p>
                  )}
                  {isCreatingClass && (
                    <p className="text-sm text-gray-500">
                      Choose students to add to your new class
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {step === 'selectStudents' && !isCreatingClass && (
                  <button
                    onClick={handleBackToClasses}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content based on step */}
            {step === 'selectClass' ? (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Choose a class to assign this work to:</h4>
                
                {/* Classes List */}
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                  {classesLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  ) : classes.length === 0 ? (
                    <div className="flex items-center justify-center p-8 text-gray-500">
                      <div className="text-center">
                        <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No classes found</p>
                        <p className="text-sm">Create a class first to assign work</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {classes.map((classData) => (
                        <motion.div
                          key={classData._id}
                          whileHover={{ backgroundColor: '#f9fafb' }}
                          onClick={() => handleClassSelection(classData)}
                          className="flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {classData.className}
                            </p>
                            <p className="text-xs text-gray-500">
                              {classData.studentIds.length} students
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                setSelectedClass(classData);
                                // Fetch students and then select entire class
                                await fetchStudentsFromClass(classData);
                                // Wait for state to update, then select all and confirm
                                setTimeout(() => {
                                  const allSelected = students.map(s => ({ ...s, isSelected: true }));
                                  if (allSelected.length > 0) {
                                    onStudentsSelected(allSelected, classData);
                                  } else {
                                    // If still no students, use fallback
                                    const fallbackStudents = classData.studentIds.map((id) => ({
                                      id,
                                      name: id.replace(/_/g, ' ').replace(/student/i, 'Student '),
                                      email: `${id}@student.com`,
                                      isSelected: true
                                    }));
                                    onStudentsSelected(fallbackStudents, classData);
                                  }
                                }, 300);
                              }}
                              className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition-colors"
                            >
                              <Crown className="w-3 h-3 mr-1 inline" />
                              Entire Class
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Search and Controls for Student Selection */}
                <div className="mb-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Quick Selection Options */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Selection Options</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={selectEntireClass}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Entire Class
                      </button>
                      <button
                        onClick={selectAll}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-emerald-600 bg-white border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {filteredStudents.every(s => s.isSelected) ? 'Deselect Visible' : 'Select Visible'}
                      </button>
                      <button
                        onClick={clearSelection}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {selectedCount === students.length ? (
                        <div className="flex items-center text-emerald-600">
                          <Crown className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">Entire class selected</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {selectedCount} of {students.length} student{students.length !== 1 ? 's' : ''} selected
                        </span>
                      )}
                    </div>
                    {searchTerm && (
                      <span className="text-xs text-gray-500">
                        {filteredStudents.length} visible
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Students List - only show when selecting students */}
            {step === 'selectStudents' && (
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-gray-500">
                  <div className="text-center">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No students found</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <motion.div
                      key={student.id}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      onClick={() => toggleStudent(student.id)}
                      className="flex items-center space-x-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        student.isSelected 
                          ? 'bg-emerald-600 border-emerald-600' 
                          : 'border-gray-300 hover:border-emerald-400'
                      }`}>
                        {student.isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {student.name}
                        </p>
                        {student.email && (
                          <p className="text-xs text-gray-500">
                            {student.email}
                          </p>
                        )}
                      </div>
                      
                      <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                        Student
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
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
              {step === 'selectStudents' && (
                <button
                  onClick={handleConfirm}
                  disabled={selectedCount === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirm Selection ({selectedCount})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}