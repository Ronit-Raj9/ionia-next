"use client";

import React, { useState } from 'react';
import { useRole, RoleUser } from '@/contexts/RoleContext';
import StudentSelector from '@/components/StudentSelector';
import ClassManager from '@/components/ClassManager';
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

interface ApiTestResults {
  login?: any;
  students?: any;
  error?: any;
}

export default function DebugFlow() {
  const { user, setUser } = useRole();
  const [showSelector, setShowSelector] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [apiTestResults, setApiTestResults] = useState<ApiTestResults | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '' });

  // Test API endpoints
  const testAPIs = async () => {
    const results: ApiTestResults = {};
    
    try {
      // Test login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email })
      });
      results.login = await loginResponse.json();

      // Test students API if we have schoolId
      if (results.login?.success && results.login.user?.schoolId) {
        const studentsResponse = await fetch(`/api/students?role=teacher&schoolId=${encodeURIComponent(results.login.user.schoolId)}`);
        results.students = await studentsResponse.json();
      }

      setApiTestResults(results);
    } catch (error) {
      console.error('API test error:', error);
      results.error = error;
      setApiTestResults(results);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Set user with new system data structure
        setUser({
          role: data.user.role,
          userId: data.user.userId,
          name: data.user.name,
          email: data.user.email,
          displayName: data.user.displayName,
          classId: data.user.classId,
          schoolId: data.user.schoolId,
          phoneNumber: data.user.phoneNumber,
          profileImage: data.user.profileImage,
          status: data.user.status,
          dashboardPreferences: data.user.dashboardPreferences,
          lastLogin: data.user.lastLogin,
          createdAt: data.user.createdAt,
          updatedAt: data.user.updatedAt
        });
        
        toast.success(`Logged in as ${data.user.name}`);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    }
  };

  const handleStudentsSelected = (students: Student[]) => {
    console.log('Students selected:', students);
    setSelectedStudents(students);
    setShowSelector(false);
    toast.success(`Selected ${students.length} students`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug Student Selection Flow
          </h1>
          <p className="text-gray-600">
            Test and debug the new authentication and student management system
          </p>
        </div>

        {/* Login Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">1. Login Test</h2>
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ email: e.target.value })}
              placeholder="Enter teacher email"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Login
            </button>
          </div>
          
          {user && (
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-medium text-green-800">Current User:</h3>
              <pre className="text-sm text-green-700 mt-2">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* API Test Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">2. API Test</h2>
          <button
            onClick={testAPIs}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-4"
          >
            Test APIs
          </button>
          
          {apiTestResults && (
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium mb-2">API Results:</h3>
              <pre className="text-sm overflow-auto max-h-96">
                {JSON.stringify(apiTestResults, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Student Selector Test */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">3. Student Selector Test</h2>
            <div className="mb-4">
              <p><strong>User ID:</strong> {user.userId}</p>
              <p><strong>School ID:</strong> {user.schoolId?.toString() || 'NOT SET'}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
            
            <button
              onClick={() => setShowSelector(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-4"
            >
              Open Student Selector
            </button>

            {selectedStudents.length > 0 && (
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-medium text-blue-800 mb-2">Selected Students:</h3>
                <div className="space-y-2">
                  {selectedStudents.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <span>{student.name} ({student.email})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Class Manager Test */}
        {user && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">4. Class Manager Test</h2>
            <ClassManager
              userId={user.userId}
              userName={user.name}
              role={user.role}
              schoolId={user.schoolId?.toString() || ''}
              onClassSelected={(classId) => {
                console.log('Class selected:', classId);
                toast.success(`Selected class: ${classId}`);
              }}
            />
          </div>
        )}

        {/* Student Selector Modal */}
        {showSelector && user && (
          <StudentSelector
            onStudentsSelected={handleStudentsSelected}
            onClose={() => setShowSelector(false)}
            classId="debug-class"
            teacherId={user.userId}
            teacherRole={user.role}
            teacherSchoolId={user.schoolId?.toString() || ''}
            isCreatingClass={true}
          />
        )}
      </div>
    </div>
  );
}
