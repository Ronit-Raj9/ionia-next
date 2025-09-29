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
}

interface StudentSelectorProps {
  onStudentsSelected: (students: Student[]) => void;
  onClose: () => void;
  classId: string;
  teacherId: string;
  teacherRole: string;
}

export default function StudentSelector({ onStudentsSelected, onClose, classId, teacherId, teacherRole }: StudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableStudents();
  }, [classId]);

  const fetchAvailableStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/students?role=${teacherRole}`);
      const data = await response.json();

      if (data.success) {
        setStudents(data.data);
        if (data.fallback) {
          toast('Using default students (database connection issue)', { icon: 'ℹ️' });
        }
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
      
      // Fallback to default students
      const fallbackStudents: Student[] = [];
      for (let i = 1; i <= 20; i++) {
        fallbackStudents.push({
          id: `student${i}`,
          name: `Student ${i}`,
          email: `student${i}@example.com`,
          isSelected: false
        });
      }
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

  const getFilteredStudents = () => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getSelectedStudents = () => {
    return students.filter(student => student.isSelected);
  };

  const handleConfirm = () => {
    const selectedStudents = getSelectedStudents();
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    onStudentsSelected(selectedStudents);
  };

  const filteredStudents = getFilteredStudents();
  const selectedCount = getSelectedStudents().length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
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
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Select Students for Class Chat
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Controls */}
            <div className="mb-4 space-y-3">
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
              
              <div className="flex items-center justify-between">
                <button
                  onClick={selectAll}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {filteredStudents.every(s => s.isSelected) ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-600">
                  {selectedCount} student{selectedCount !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>

            {/* Students List */}
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

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Chat with {selectedCount} Student{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
