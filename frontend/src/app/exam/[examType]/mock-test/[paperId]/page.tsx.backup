"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface TestDetails {
  _id: string;
  title: string;
  description: string;
  duration?: number;
  totalMarks?: number;
  testCategory?: string;
  status?: string;
  subject?: string;
  difficulty?: string;
  platformTestType?: string;
  questionCount?: number;
  tags?: string[];
  instructions?: string;
  solutionsVisibility?: string;
  attemptsAllowed?: number;
}

const TestDetailsPage = () => {
  const { examType, paperId } = useParams() as { examType: string; paperId: string };
  const [testDetails, setTestDetails] = useState<TestDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Format exam type for display
  const formatExamType = (type: string) => {
    const formats: Record<string, string> = {
      'cuet': 'CUET',
      'jee-mains': 'JEE Mains',
      'jee-advanced': 'JEE Advanced'
    };
    return formats[type] || type;
  };

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${paperId}`, {
          credentials: 'include',
          headers: { 
           'Content-Type': 'application/json',
          }
        });
        if (!res.ok) {
          throw new Error("Failed to fetch test details");
        }
        const responseData = await res.json();
        console.log('Test details:', responseData);
        
        if (responseData.success && responseData.data) {
          setTestDetails(responseData.data);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error fetching test details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (paperId) {
      fetchTestDetails();
    }
  }, [paperId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-4 text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center bg-red-50 p-8 rounded-lg shadow-sm max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Test</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => router.back()}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!testDetails) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center bg-yellow-50 p-8 rounded-lg shadow-sm max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Test Not Found</h2>
          <p className="text-yellow-600">The requested test could not be found or is no longer available.</p>
          <button 
            onClick={() => router.back()}
            className="mt-6 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 min-h-[70vh] mb-24">
      <div className="flex flex-col md:flex-row items-start justify-between mb-8">
        <div>
          <p className="text-sm text-gray-500 mb-2">{formatExamType(examType)} Mock Test</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{testDetails.title}</h1>
          {testDetails.description && (
            <p className="mt-3 text-gray-600 max-w-2xl">{testDetails.description}</p>
          )}
        </div>
        
        <div className="mt-6 md:mt-0">
          <button
            onClick={() => router.push(`/exam/${examType}/mock-test/${paperId}/instructions`)}
            className="px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Test Information */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Test Information</h2>
              <div className="prose max-w-none">
                {testDetails.instructions && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Instructions</h3>
                    <p className="text-gray-600">{testDetails.instructions}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {testDetails.subject && (
                    <div>
                      <h4 className="text-gray-500 text-sm font-medium">Subject</h4>
                      <p className="text-gray-800">{testDetails.subject}</p>
                    </div>
                  )}
                  
                  {testDetails.difficulty && (
                    <div>
                      <h4 className="text-gray-500 text-sm font-medium">Difficulty</h4>
                      <p className="text-gray-800 capitalize">{testDetails.difficulty}</p>
                    </div>
                  )}
                  
                  {testDetails.questionCount !== undefined && (
                    <div>
                      <h4 className="text-gray-500 text-sm font-medium">Number of Questions</h4>
                      <p className="text-gray-800">{testDetails.questionCount}</p>
                    </div>
                  )}
                  
                  {testDetails.duration !== undefined && (
                    <div>
                      <h4 className="text-gray-500 text-sm font-medium">Duration</h4>
                      <p className="text-gray-800">{testDetails.duration} minutes</p>
                    </div>
                  )}
                  
                  {testDetails.totalMarks !== undefined && (
                    <div>
                      <h4 className="text-gray-500 text-sm font-medium">Total Marks</h4>
                      <p className="text-gray-800">{testDetails.totalMarks}</p>
                    </div>
                  )}
                  
                  {testDetails.attemptsAllowed !== undefined && (
                    <div>
                      <h4 className="text-gray-500 text-sm font-medium">Attempts Allowed</h4>
                      <p className="text-gray-800">
                        {testDetails.attemptsAllowed === null ? 'Unlimited' : testDetails.attemptsAllowed}
                      </p>
                    </div>
                  )}
                  
                  {testDetails.solutionsVisibility && (
                    <div>
                      <h4 className="text-gray-500 text-sm font-medium">Solutions Available</h4>
                      <p className="text-gray-800 capitalize">{testDetails.solutionsVisibility.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {testDetails.tags && testDetails.tags.length > 0 && (
            <div className="mt-6 p-6 bg-white rounded-xl shadow-md">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {testDetails.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column for additional information */}
        <div className="col-span-1">
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Summary</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{testDetails.duration || 'N/A'} minutes</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="font-medium">{testDetails.totalMarks || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="font-medium">{testDetails.questionCount || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Difficulty</p>
                  <p className="font-medium capitalize">{testDetails.difficulty || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                onClick={() => router.push(`/exam/${examType}/mock-test/${paperId}/instructions`)}
                className="w-full py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors text-center"
              >
                Start Test
              </button>
              
              <button
                onClick={() => router.back()}
                className="w-full mt-3 py-3 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors text-center"
              >
                Back to Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDetailsPage;
