"use client";

import React, { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import StudentSelector from '@/components/StudentSelector';
import ClassManager from '@/components/ClassManager';
import toast from 'react-hot-toast';

export default function DebugFlow() {
  const { user, setRole } = useRole();
  const [showSelector, setShowSelector] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [apiTestResults, setApiTestResults] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ email: 'teacher.demo@school.com' });

  // Test API endpoints
  const testAPIs = async () => {
    const results: any = {};
    
    try {
      // Test login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email })
      });
      results.login = await loginResponse.json();

      // Test students API if we have schoolId
      if (results.login.success && results.login.user.schoolId) {
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
        // Set role with user data
        setRole(data.user.role, data.user.mockUserId);
        
        // Store user info
        localStorage.setItem('ionia_user_info', JSON.stringify({
          name: data.user.name,
          email: data.user.email,
          schoolId: data.user.schoolId,
          role: data.user.role,
          mockUserId: data.user.mockUserId,
          userId: data.user.userId
        }));
        
        toast.success(`Logged in as ${data.user.name}`);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    }
  };

  const handleStudentsSelected = (students: any[]) => {
    console.log('Students selected:', students);
    setSelectedStudents(students);
    setShowSelector(false);
    toast.success(`Selected ${students.length} students`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Debug Student Selection Flow
        </h1>

        {/* Login Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">1. Login Test</h2>
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ email: e.target.value })}
              placeholder="Email"
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
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
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded mb-4"
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
              <p><strong>Teacher ID:</strong> {user.mockUserId}</p>
              <p><strong>School ID:</strong> {user.schoolId || 'NOT SET'}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
            
            <button
              onClick={() => setShowSelector(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mb-4"
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
              userId={user.mockUserId}
              userName={user.name}
              role={user.role}
              schoolId={user.schoolId || ''}
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
            teacherId={user.mockUserId}
            teacherRole={user.role}
            teacherSchoolId={user.schoolId || ''}
            isCreatingClass={true}
          />
        )}
      </div>
    </div>
  );
}
