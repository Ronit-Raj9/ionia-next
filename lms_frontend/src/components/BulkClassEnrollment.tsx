"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Users,
  Trash2,
  Plus,
  Download,
  CheckCircle,
  AlertCircle,
  Copy,
  FileDown,
  X,
  BookOpen,
  Upload,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

interface EnrollmentEntry {
  id: string;
  studentId?: string;
  studentEmail?: string;
  studentName?: string;
  className: string;
  classId?: string; // Will be filled after validation
}

interface BulkClassEnrollmentProps {
  adminUserId?: string;
  role: 'admin' | 'superadmin';
  schoolId: string;
  onComplete?: () => void;
}

export default function BulkClassEnrollment({
  adminUserId,
  role,
  schoolId,
  onComplete,
}: BulkClassEnrollmentProps) {
  const [enrollments, setEnrollments] = useState<EnrollmentEntry[]>([
    { id: Date.now().toString(), className: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [enrollmentResults, setEnrollmentResults] = useState<any[]>([]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [searchClass, setSearchClass] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  useEffect(() => {
    fetchAvailableClasses();
    fetchAvailableStudents();
  }, [adminUserId, role, schoolId]);

  const fetchAvailableClasses = async () => {
    try {
      // For admin/superadmin, fetch all classes in the school
      const url = `/api/classes/school?schoolId=${schoolId}&role=${role}&userId=${adminUserId}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setAvailableClasses(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const response = await fetch(`/api/students?role=${role}&schoolId=${encodeURIComponent(schoolId)}`);
      const data = await response.json();

      if (data.success) {
        setAvailableStudents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const addEnrollment = () => {
    const newEnrollment: EnrollmentEntry = {
      id: Date.now().toString(),
      className: ''
    };
    setEnrollments([...enrollments, newEnrollment]);
  };

  const removeEnrollment = (id: string) => {
    if (enrollments.length === 1) {
      toast.error('You must have at least one enrollment entry');
      return;
    }
    setEnrollments(enrollments.filter(e => e.id !== id));
  };

  const updateEnrollment = (id: string, field: keyof EnrollmentEntry, value: string) => {
    setEnrollments(enrollments.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const findStudentByField = (value: string): any => {
    const searchLower = value.toLowerCase().trim();
    return availableStudents.find(s => 
      s.id?.toLowerCase() === searchLower ||
      s.email?.toLowerCase() === searchLower ||
      s.name?.toLowerCase() === searchLower
    );
  };

  // Parse class name to extract subject and grade
  const parseClassName = (className: string): { subject: string | null; grade: string | null } => {
    if (!className || !className.trim()) return { subject: null, grade: null };
    
    const lowerName = className.trim().toLowerCase();
    
    // Common subject keywords
    const subjects = ['science', 'math', 'mathematics', 'english', 'history', 'physics', 'chemistry', 'biology', 'computer science', 'cs'];
    
    // Extract subject
    let foundSubject: string | null = null;
    for (const subject of subjects) {
      if (lowerName.includes(subject)) {
        foundSubject = subject;
        break;
      }
    }
    
    // Extract grade number (look for patterns like "7", "8", "grade 7", "class 7", etc.)
    const gradeMatch = lowerName.match(/(?:grade|class|g|gr)\s*(\d+)|^(\d+)(?:\s|$)|(\d+)(?:\s|$)/i);
    let foundGrade: string | null = null;
    
    if (gradeMatch) {
      foundGrade = gradeMatch[1] || gradeMatch[2] || gradeMatch[3] || null;
    }
    
    return { subject: foundSubject, grade: foundGrade };
  };

  const findClassByName = (className: string): any => {
    if (!className || !className.trim()) return null;
    
    // First try exact class name match
    const exactMatch = availableClasses.find(c => 
      c.className?.toLowerCase() === className.trim().toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    // Parse subject and grade from the input
    const { subject, grade } = parseClassName(className);
    
    if (!subject && !grade) {
      // If we can't parse subject/grade, try partial name match as fallback
      return availableClasses.find(c => 
        c.className?.toLowerCase().includes(className.toLowerCase()) ||
        className.toLowerCase().includes(c.className?.toLowerCase() || '')
      );
    }
    
    // Match by subject and grade
    const match = availableClasses.find(c => {
      const cSubject = c.subject?.toLowerCase() || '';
      const cGrade = c.grade?.toLowerCase() || '';
      const cClassName = c.className?.toLowerCase() || '';
      
      let matchesSubject = false;
      let matchesGrade = false;
      
      // Match subject
      if (subject) {
        matchesSubject = cSubject.includes(subject) || 
                        subject.includes(cSubject) ||
                        cClassName.includes(subject);
      }
      
      // Match grade (extract number from grade string if needed)
      if (grade) {
        const cGradeNum = cGrade.match(/\d+/)?.[0] || cGrade.replace(/\D/g, '');
        const gradeNum = grade;
        
        matchesGrade = cGradeNum === gradeNum ||
                      cGrade.includes(gradeNum) ||
                      gradeNum.includes(cGradeNum) ||
                      cClassName.includes(gradeNum);
      }
      
      // If both subject and grade are provided, both must match
      if (subject && grade) {
        return matchesSubject && matchesGrade;
      }
      // If only subject is provided, match subject
      if (subject && !grade) {
        return matchesSubject;
      }
      // If only grade is provided, match grade
      if (grade && !subject) {
        return matchesGrade;
      }
      
      return false;
    });
    
    return match;
  };

  const validateEnrollments = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    enrollments.forEach((enrollment, index) => {
      const lineNum = index + 1;
      
      // Must have at least student identifier and class name
      const hasStudent = enrollment.studentId || enrollment.studentEmail || enrollment.studentName;
      if (!hasStudent) {
        errors.push(`Line ${lineNum}: Student identifier (ID/Email/Name) is required`);
      }
      
      if (!enrollment.className.trim()) {
        errors.push(`Line ${lineNum}: Class name is required`);
      }

      // Validate student exists
      if (hasStudent) {
        const studentValue = enrollment.studentId || enrollment.studentEmail || enrollment.studentName || '';
        const student = findStudentByField(studentValue);
        if (!student) {
          errors.push(`Line ${lineNum}: Student "${studentValue}" not found in school`);
        }
      }

      // Validate class exists
      if (enrollment.className.trim()) {
        const classData = findClassByName(enrollment.className);
        if (!classData) {
          errors.push(`Line ${lineNum}: Class "${enrollment.className}" not found`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleBulkEnroll = async () => {
    const validation = validateEnrollments();
    
    if (!validation.valid) {
      toast.error(`Found ${validation.errors.length} error(s). Please fix them before proceeding.`);
      console.error('Validation errors:', validation.errors);
      return;
    }

    setLoading(true);
    const results: any[] = [];

    try {
      // Prepare enrollment data
      const enrollmentData = enrollments.map(enrollment => {
        const student = findStudentByField(
          enrollment.studentId || enrollment.studentEmail || enrollment.studentName || ''
        );
        const classData = findClassByName(enrollment.className);
        
        return {
          studentId: student?.id,
          classId: classData?._id?.toString(), // Convert ObjectId to string
          className: classData?.className || enrollment.className // Include className for API fallback
        };
      }).filter(e => e.studentId && (e.classId || e.className)); // Allow className if classId missing

      // Call bulk enrollment API
      const response = await fetch('/api/classes/bulk-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUserId: adminUserId,
          creatorRole: role,
          schoolId: schoolId,
          enrollments: enrollmentData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEnrollmentResults(data.data || []);
        setShowResults(true);
        toast.success(`Successfully enrolled ${data.data?.length || 0} student(s) into classes!`);
        
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(data.error || 'Failed to enroll students');
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enroll students');
    } finally {
      setLoading(false);
    }
  };

  const parsePastedData = () => {
    const lines = pasteData.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast.error('No data to parse. Please paste enrollment data.');
      return;
    }

    const parsedEnrollments: EnrollmentEntry[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split('|').map(part => part.trim());
      
      // Format: StudentIdentifier | ClassName
      // StudentIdentifier can be: StudentID, Email, or Name
      if (parts.length < 2) {
        errors.push(`Line ${index + 1}: Expected format "StudentID|ClassName" or "Email|ClassName" or "Name|ClassName", got ${parts.length} field(s)`);
        return;
      }

      const [studentIdentifier, className] = parts;

      if (!studentIdentifier || !className) {
        errors.push(`Line ${index + 1}: Both student identifier and class name are required`);
        return;
      }

      // Determine if it's ID, Email, or Name based on format
      let enrollment: EnrollmentEntry = {
        id: `${Date.now()}-${index}`,
        className: className
      };

      if (studentIdentifier.includes('@')) {
        enrollment.studentEmail = studentIdentifier;
      } else if (studentIdentifier.startsWith('STUDENT-')) {
        enrollment.studentId = studentIdentifier;
      } else {
        // Assume it's a name
        enrollment.studentName = studentIdentifier;
      }

      parsedEnrollments.push(enrollment);
    });

    if (errors.length > 0) {
      toast.error(`Found ${errors.length} error(s). Check console for details.`);
      console.error('Paste parsing errors:', errors);
      return;
    }

    if (parsedEnrollments.length > 0) {
      setEnrollments(parsedEnrollments);
      setPasteMode(false);
      setPasteData('');
      toast.success(`${parsedEnrollments.length} enrollment(s) loaded from pasted data!`);
    }
  };

  const handlePasteImport = () => {
    parsePastedData();
  };

  const exportResults = () => {
    if (!enrollmentResults || enrollmentResults.length === 0) return;

    const csvContent = [
      ['Student Name', 'Student ID', 'Class Name', 'Status'].join(','),
      ...enrollmentResults.map(r => [
        r.studentName || '',
        r.studentId || '',
        r.className || '',
        r.status || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-enrollment-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Results exported successfully!');
  };

  const exportClassData = () => {
    if (!availableClasses || availableClasses.length === 0) {
      toast.error('No classes available to export');
      return;
    }

    // Export class names for easy copy-paste
    const classNames = availableClasses.map(c => c.className || '').filter(name => name).join('\n');
    
    const csvContent = [
      ['Class Name', 'Class ID', 'Teacher', 'Students'].join(','),
      ...availableClasses.map(c => [
        c.className || '',
        c._id?.toString() || '',
        c.teacherName || c.teacherId || '',
        (c.studentIds?.length || 0).toString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-data-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${availableClasses.length} class(es) data!`);
  };

  const filteredClasses = availableClasses.filter(c =>
    c.className?.toLowerCase().includes(searchClass.toLowerCase())
  );

  const filteredStudents = availableStudents.filter(s =>
    s.name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.id?.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Class Enrollment</h2>
            <p className="text-gray-600">
              Enroll multiple students into multiple classes at once. Efficient class roster management.
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={exportClassData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 text-sm"
              title="Export class names for easy reference"
            >
              <Download className="w-4 h-4" />
              <span>Export Class Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Format Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Format Guide</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Format:</strong> StudentIdentifier | Subject Class Grade</p>
          <p><strong>StudentIdentifier can be:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Student ID (e.g., STUDENT-20250101-ABC123)</li>
            <li>Email (e.g., student@example.com)</li>
            <li>Student Name (e.g., John Doe)</li>
          </ul>
          <p className="mt-2"><strong>Class matching:</strong> Classes are matched by <strong>Subject</strong> and <strong>Grade</strong>, not by class name.</p>
          <p className="mt-2"><strong>Examples:</strong></p>
          <code className="block bg-white p-2 rounded text-xs mt-1">
            STUDENT-20250101-ABC123 | Science Class 7<br/>
            john.doe@school.com | Science Class 8<br/>
            Jane Smith | Math Grade 10<br/>
            STUDENT-123 | English 9
          </code>
          <p className="mt-2 text-xs text-blue-700">💡 Tip: Use "Subject Class X" or "Subject Grade X" format where X is the grade number. The system will find classes matching that subject and grade.</p>
        </div>
      </div>

      {/* Import Method Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setPasteMode(false)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              !pasteMode
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📝 Manual Entry
          </button>
          <button
            onClick={() => setPasteMode(true)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              pasteMode
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📋 Paste Import
          </button>
        </div>
      </div>

      {/* Paste Import Mode */}
      {pasteMode ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste Enrollment Data (pipe-separated format)
            </label>
            <textarea
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder={`student23@example.com | Science Class 7\nstudent24@example.com | Science Class 8\njohn.doe@school.com | Math Grade 10`}
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Paste data in format: StudentIdentifier | Subject Class Grade (e.g., Science Class 7)
            </p>
            <button
              onClick={handlePasteImport}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Enrollment Entries</h3>
            <button
              onClick={addEnrollment}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Entry</span>
            </button>
          </div>

          {/* Available Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Available Classes */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Available Classes ({availableClasses.length})</h4>
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchClass}
                  onChange={(e) => setSearchClass(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredClasses.slice(0, 5).map((classData) => (
                  <div key={classData._id} className="text-xs p-2 bg-gray-50 rounded">
                    {classData.className}
                  </div>
                ))}
                {filteredClasses.length > 5 && (
                  <p className="text-xs text-gray-500">+ {filteredClasses.length - 5} more</p>
                )}
              </div>
            </div>

            {/* Available Students */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Available Students ({availableStudents.length})</h4>
              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredStudents.slice(0, 5).map((student) => (
                  <div key={student.id} className="text-xs p-2 bg-gray-50 rounded">
                    {student.name} ({student.id})
                  </div>
                ))}
                {filteredStudents.length > 5 && (
                  <p className="text-xs text-gray-500">+ {filteredStudents.length - 5} more</p>
                )}
              </div>
            </div>
          </div>

          {/* Enrollment Entries Table */}
          <div className="space-y-3">
            {enrollments.map((enrollment, index) => (
              <div key={enrollment.id} className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600 w-8">{index + 1}</span>
                
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Student ID, Email, or Name"
                    value={enrollment.studentId || enrollment.studentEmail || enrollment.studentName || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes('@')) {
                        updateEnrollment(enrollment.id, 'studentEmail', value);
                        updateEnrollment(enrollment.id, 'studentId', '');
                        updateEnrollment(enrollment.id, 'studentName', '');
                      } else if (value.startsWith('STUDENT-')) {
                        updateEnrollment(enrollment.id, 'studentId', value);
                        updateEnrollment(enrollment.id, 'studentEmail', '');
                        updateEnrollment(enrollment.id, 'studentName', '');
                      } else {
                        updateEnrollment(enrollment.id, 'studentName', value);
                        updateEnrollment(enrollment.id, 'studentId', '');
                        updateEnrollment(enrollment.id, 'studentEmail', '');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <span className="text-gray-400">|</span>
                
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Class Name"
                    value={enrollment.className}
                    onChange={(e) => updateEnrollment(enrollment.id, 'className', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  />
                </div>
                
                <button
                  onClick={() => removeEnrollment(enrollment.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={handleBulkEnroll}
          disabled={loading || enrollments.length === 0}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Enrolling...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              <span>Enroll {enrollments.length} Student(s)</span>
            </>
          )}
        </button>
      </div>

      {/* Results Modal */}
      {showResults && enrollmentResults.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Enrollment Results</h3>
                  <p className="text-sm text-gray-600">
                    {enrollmentResults.filter(r => r.status === 'success').length} successful,{' '}
                    {enrollmentResults.filter(r => r.status === 'error').length} failed
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportResults}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => {
                    setShowResults(false);
                    setEnrollments([{ id: Date.now().toString(), className: '' }]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {enrollmentResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {result.studentName} → {result.className}
                      </p>
                      {result.error && (
                        <p className="text-xs text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {result.status === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

