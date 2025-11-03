"use client";

import React, { useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentEntry {
  id: string;
  name: string;
  email: string;
  class: string;
  section: string;
}

interface GeneratedCredential {
  name: string;
  email: string;
  class: string;
  section: string;
  userId: string;
  password: string;
}

interface BulkStudentCreationProps {
  adminUserId: string;
  adminRole: string;
  schoolId: string;
  onComplete?: () => void;
}

export default function BulkStudentCreation({
  adminUserId,
  adminRole,
  schoolId,
  onComplete,
}: BulkStudentCreationProps) {
  const [students, setStudents] = useState<StudentEntry[]>([
    { id: Date.now().toString(), name: '', email: '', class: '', section: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredential[]>([]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteData, setPasteData] = useState('');

  const addStudent = () => {
    const newStudent: StudentEntry = {
      id: Date.now().toString(),
      name: '',
      email: '',
      class: '',
      section: '',
    };
    setStudents([...students, newStudent]);
  };

  const removeStudent = (id: string) => {
    if (students.length === 1) {
      toast.error('You must have at least one student entry');
      return;
    }
    setStudents(students.filter(s => s.id !== id));
  };

  const updateStudent = (id: string, field: keyof StudentEntry, value: string) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const validateStudents = (): boolean => {
    // Check if all fields are filled
    const allFilled = students.every(s => 
      s.name.trim() && s.email.trim() && s.class.trim() && s.section.trim()
    );

    if (!allFilled) {
      toast.error('Please fill in all fields for all students');
      return false;
    }

    // Check for duplicate emails
    const emails = students.map(s => s.email.toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicates.length > 0) {
      toast.error(`Duplicate emails found: ${duplicates.join(', ')}`);
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = students.filter(s => !emailRegex.test(s.email));
    
    if (invalidEmails.length > 0) {
      toast.error('Some emails are invalid. Please check all email addresses.');
      return false;
    }

    return true;
  };

  const handleBulkCreate = async () => {
    if (!validateStudents()) {
      return;
    }

    setLoading(true);
    const createdCredentials: GeneratedCredential[] = [];
    const errors: string[] = [];

    try {
      // Create students one by one
      for (const student of students) {
        try {
          const response = await fetch('/api/users/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creatorUserId: adminUserId,
              creatorRole: adminRole,
              creatorSchoolId: schoolId,
              targetRole: 'student',
              targetSchoolId: schoolId,
              name: student.name,
              email: student.email,
              phoneNumber: '',
              displayName: `${student.name} (${student.class}-${student.section})`,
              // Store class and section in a custom field or classId
              classId: `${student.class}-${student.section}`,
            }),
          });

          const data = await response.json();

          if (data.success) {
            createdCredentials.push({
              name: student.name,
              email: student.email,
              class: student.class,
              section: student.section,
              userId: data.data.credentials.userId,
              password: data.data.credentials.password,
            });
          } else {
            errors.push(`${student.name}: ${data.error}`);
          }
        } catch (error) {
          errors.push(`${student.name}: Failed to create account`);
        }
      }

      if (createdCredentials.length > 0) {
        setGeneratedCredentials(createdCredentials);
        setShowCredentials(true);
        toast.success(`${createdCredentials.length} student account(s) created successfully!`);
        
        // Reset form
        setStudents([
          { id: Date.now().toString(), name: '', email: '', class: '', section: '' }
        ]);

        if (onComplete) {
          onComplete();
        }
      }

      if (errors.length > 0) {
        toast.error(`Failed to create ${errors.length} account(s). Check console for details.`);
        console.error('Bulk creation errors:', errors);
      }

    } catch (error) {
      console.error('Error in bulk creation:', error);
      toast.error('Failed to create student accounts');
    } finally {
      setLoading(false);
    }
  };

  const copyAllCredentials = () => {
    const credentialsText = generatedCredentials.map(cred => 
      `Name: ${cred.name}\nClass: ${cred.class}-${cred.section}\nEmail: ${cred.email}\nUser ID: ${cred.userId}\nPassword: ${cred.password}\n---`
    ).join('\n');
    
    navigator.clipboard.writeText(credentialsText);
    toast.success('All credentials copied to clipboard!');
  };

  const copyPipeFormat = () => {
    const credentialsText = generatedCredentials.map(cred => 
      `${cred.name} | ${cred.email} | ${cred.userId} | ${cred.password}`
    ).join('\n');
    
    navigator.clipboard.writeText(credentialsText);
    toast.success('Credentials copied in pipe format!');
  };

  const downloadCredentialsCSV = () => {
    const csvHeader = 'Name,Email,Class,Section,User ID,Password\n';
    const csvRows = generatedCredentials.map(cred =>
      `"${cred.name}","${cred.email}","${cred.class}","${cred.section}","${cred.userId}","${cred.password}"`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-credentials-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Credentials downloaded as CSV!');
  };

  const downloadCredentialsPDF = () => {
    // Create a formatted text document
    const content = generatedCredentials.map((cred, index) => 
      `STUDENT ${index + 1}\n` +
      `────────────────────────────────\n` +
      `Name:      ${cred.name}\n` +
      `Class:     ${cred.class}-${cred.section}\n` +
      `Email:     ${cred.email}\n` +
      `User ID:   ${cred.userId}\n` +
      `Password:  ${cred.password}\n` +
      `────────────────────────────────\n\n`
    ).join('');

    const fullContent = 
      `STUDENT CREDENTIALS\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `School ID: ${schoolId}\n` +
      `Total Students: ${generatedCredentials.length}\n\n` +
      `════════════════════════════════════════\n\n` +
      content +
      `\n⚠️ IMPORTANT: Keep these credentials secure!\n` +
      `Distribute to students individually.`;

    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-credentials-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Credentials downloaded as text file!');
  };

  const clearAll = () => {
    setStudents([
      { id: Date.now().toString(), name: '', email: '', class: '', section: '' }
    ]);
  };

  const parsePastedData = () => {
    const lines = pasteData.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast.error('No data to parse. Please paste student data.');
      return;
    }

    const parsedStudents: StudentEntry[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split('|').map(part => part.trim());
      
      if (parts.length !== 4) {
        errors.push(`Line ${index + 1}: Expected 4 fields (Name | Email | Class | Section), got ${parts.length}`);
        return;
      }

      const [name, email, studentClass, section] = parts;

      if (!name || !email || !studentClass || !section) {
        errors.push(`Line ${index + 1}: All fields must be filled`);
        return;
      }

      parsedStudents.push({
        id: `${Date.now()}-${index}`,
        name,
        email,
        class: studentClass,
        section,
      });
    });

    if (errors.length > 0) {
      toast.error(`Found ${errors.length} error(s). Check console for details.`);
      console.error('Paste parsing errors:', errors);
      return;
    }

    if (parsedStudents.length > 0) {
      setStudents(parsedStudents);
      setPasteMode(false);
      setPasteData('');
      toast.success(`${parsedStudents.length} student(s) loaded from pasted data!`);
    }
  };

  const handlePasteImport = () => {
    parsePastedData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-xl border border-emerald-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Student Creation</h2>
            <p className="text-gray-600">
              Add multiple students at once. Each will receive auto-generated credentials.
            </p>
          </div>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Paste Student Data</h3>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-emerald-700 font-medium mb-2">Format (one student per line):</p>
            <code className="text-sm text-blue-900 bg-white px-3 py-2 rounded block">
              Name | Email | Class | Section
            </code>
            <p className="text-xs text-emerald-600 mt-2">
              Example: Samuel White | student81@example.com | 10th | A
            </p>
          </div>

          <textarea
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder="Paste your student data here (one per line):

Samuel White | student81@example.com | 10th | A
Grace Miller | student82@example.com | 10th | A
Olivia Brown | student83@example.com | 10th | A
Christopher Harris | student84@example.com | 10th | A"
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm resize-none"
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {pasteData.trim().split('\n').filter(line => line.trim()).length} line(s) detected
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setPasteData('');
                  toast.success('Cleared paste data');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handlePasteImport}
                disabled={!pasteData.trim()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                Import Students
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Manual Entry Mode - Students Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Student Details ({students.length} student{students.length !== 1 ? 's' : ''})
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearAll}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={addStudent}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

        {/* Table Header */}
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="grid grid-cols-12 gap-2 mb-2 px-2 py-2 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Full Name *</div>
              <div className="col-span-3">Email *</div>
              <div className="col-span-2">Class *</div>
              <div className="col-span-2">Section *</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Student Rows */}
            <div className="space-y-2">
              <AnimatePresence>
                {students.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full font-medium text-sm">
                        {index + 1}
                      </span>
                    </div>
                    
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <input
                        type="email"
                        value={student.email}
                        onChange={(e) => updateStudent(student.id, 'email', e.target.value)}
                        placeholder="student@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={student.class}
                        onChange={(e) => updateStudent(student.id, 'class', e.target.value)}
                        placeholder="10th"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={student.section}
                        onChange={(e) => updateStudent(student.id, 'section', e.target.value)}
                        placeholder="A"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeStudent(student.id)}
                        disabled={students.length === 1}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Quick Add Templates */}
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Add:</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                for (let i = 0; i < 5; i++) {
                  addStudent();
                }
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              + Add 5 Students
            </button>
            <button
              onClick={() => {
                for (let i = 0; i < 10; i++) {
                  addStudent();
                }
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              + Add 10 Students
            </button>
            <button
              onClick={() => {
                for (let i = 0; i < 20; i++) {
                  addStudent();
                }
              }}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              + Add 20 Students
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-emerald-700">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Fill in student details for all students</li>
                <li>Click "Create All Students"</li>
                <li>System generates unique User ID and Password for each</li>
                <li>Download credentials as CSV or Text file</li>
                <li>Distribute credentials to students/parents</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Ready to create <strong>{students.length}</strong> student account{students.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={handleBulkCreate}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating {students.length} Account{students.length !== 1 ? 's' : ''}...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create All Students ({students.length})</span>
              </>
            )}
          </button>
        </div>
        </div>
      )}

      {/* Summary Bar (shown in both modes) */}
      {students.length > 0 && !pasteMode && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                <strong>{students.length}</strong> student{students.length !== 1 ? 's' : ''} ready to create
              </p>
            </div>
            <button
              onClick={handleBulkCreate}
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create All Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && generatedCredentials.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {generatedCredentials.length} Student Account{generatedCredentials.length !== 1 ? 's' : ''} Created!
                  </h3>
                  <p className="text-sm text-gray-600">Save these credentials before closing</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCredentials(false);
                  setGeneratedCredentials([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Warning */}
            <div className="px-6 pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> This is the only time you'll see these passwords.
                    Download the credentials or copy them before closing this dialog.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={downloadCredentialsCSV}
                  className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <FileDown className="w-5 h-5" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={downloadCredentialsPDF}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Text</span>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={copyAllCredentials}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy (Formatted)</span>
                </button>
                <button
                  onClick={copyPipeFormat}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="w-5 h-5" />
                  <span>Copy (Name | Email | ID | Pass)</span>
                </button>
              </div>
            </div>

            {/* Credentials List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-4">
                {generatedCredentials.map((cred, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{cred.name}</h4>
                        <p className="text-sm text-gray-600">
                          Class {cred.class}-{cred.section} • {cred.email}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-blue-800">
                        Student #{index + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">User ID</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            readOnly
                            value={cred.userId}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cred.userId);
                              toast.success(`User ID copied for ${cred.name}!`);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            readOnly
                            value={cred.password}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(cred.password);
                              toast.success(`Password copied for ${cred.name}!`);
                            }}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total: <strong>{generatedCredentials.length}</strong> student credential{generatedCredentials.length !== 1 ? 's' : ''} generated
                </p>
                <button
                  onClick={() => {
                    setShowCredentials(false);
                    setGeneratedCredentials([]);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
                >
                  I've Saved All Credentials
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

