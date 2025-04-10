"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Paper {
  _id: string;
  title: string;
  description: string;
  duration?: number;
  totalMarks?: number;
  tags?: string[];
  testCategory?: string;
}

const MockTests = () => {
  const { examType } = useParams() as { examType: string };
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Map URL param to backend examType value
  const getExamTypeParam = (urlExamType: string) => {
    const mapping: Record<string, string> = {
      'cuet': 'cuet',
      'jee-mains': 'jee_main',
      'jee-advanced': 'jee_adv'
    };
    return mapping[urlExamType] || urlExamType;
  };

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        // Get the correct examType value for the API
        const apiExamType = getExamTypeParam(examType);
        
        // Fetch specifically mock tests for the current exam type
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/tests?testCategory=Platform&platformTestType=Mock&examType=${apiExamType}`;
        console.log('Fetching from URL:', apiUrl);
        
        const res = await fetch(apiUrl);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch ${examType} mock tests`);
        }
        
        const responseData = await res.json();
        console.log('API Response:', responseData);
        
        // The API response structure has tests in responseData.data.docs
        if (responseData.success && responseData.data && responseData.data.docs) {
          console.log('Parsed Mock Tests:', responseData.data.docs);
          setPapers(responseData.data.docs);
        } else {
          console.log('No data found in response');
          setPapers([]);
        }
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(`Error fetching ${examType} mock tests.`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPapers();
  }, [examType]);

  // Format exam type for display
  const formatExamType = (type: string) => {
    const formats: Record<string, string> = {
      'cuet': 'CUET',
      'jee-mains': 'JEE Mains',
      'jee-advanced': 'JEE Advanced'
    };
    return formats[type] || type;
  };

  if (loading) return (
    <div className="container mx-auto p-6 text-center min-h-[70vh] flex items-center justify-center">
      <p className="text-xl">Loading {formatExamType(examType)} mock tests...</p>
    </div>
  );
  
  if (error) return (
    <div className="container mx-auto p-6 text-center min-h-[70vh] flex items-center justify-center">
      <p className="text-red-500">{error}</p>
    </div>
  );

  return (
    <div className="container mx-auto p-6 min-h-[70vh] mb-24">
      <h1 className="text-3xl font-bold mb-10">{formatExamType(examType)} Mock Tests</h1>
      {papers && papers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {papers.map((paper) => (
            <div
              key={paper._id}
              className="bg-white p-8 rounded-lg shadow-md cursor-pointer hover:shadow-xl transition-shadow duration-300 border border-gray-100 min-h-[300px] flex flex-col justify-between"
            >
              <div>
                <h2 className="text-2xl font-semibold text-primary mb-3">{paper.title}</h2>
                <p className="text-gray-700 mb-6">{paper.description}</p>
                
                <div className="flex flex-wrap gap-3 mt-6">
                  {paper.duration && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {paper.duration} mins
                    </span>
                  )}
                  {paper.totalMarks && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-50 text-green-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {paper.totalMarks} marks
                    </span>
                  )}
                  {paper.testCategory && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-50 text-purple-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {paper.testCategory}
                    </span>
                  )}
                  {paper.tags && paper.tags.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-yellow-50 text-yellow-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {paper.tags.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end" onClick={() => router.push(`/exam/${examType}/mock-test/${paper._id}`)}>
                <button className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-base font-medium">
                  Start Test
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-lg shadow-sm border border-gray-100 mb-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xl font-medium text-gray-600">No {formatExamType(examType)} mock tests available at this time.</p>
          <p className="mt-2 text-gray-500">Please check back later for updates.</p>
        </div>
      )}
    </div>
  );
};

export default MockTests;
