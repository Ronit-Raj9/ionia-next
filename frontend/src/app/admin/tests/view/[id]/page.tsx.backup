"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from 'react-hot-toast';
import { 
  ClipboardList, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  GraduationCap,
  CalendarDays,
  Trash2,
  Edit,
  Check,
  Tag
} from "lucide-react";

interface Question {
  _id: string;
  question: {
    text: string;
    image?: { url?: string; publicId?: string };
  } | string;
  image?: { url?: string; publicId?: string };
  questionType?: 'single' | 'multiple' | 'numerical';
  options?: Array<{ text?: string; image?: { url?: string; publicId?: string } } | string>;
  correctOptions?: number[];
  correctOption?: number;
  marks: number;
}

interface Test {
  _id: string;
  title: string;
  testCategory: 'PYQ' | 'Platform' | 'UserCustom'; 
  description?: string;
  instructions?: string;
  subject: string;
  examType: string;
  class: string;
  difficulty: string;
  status: 'draft' | 'published' | 'archived';
  duration: number;
  year?: number;
  questions: (Question | string)[];
  createdAt: string;
  updatedAt: string;
}

const TestDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  
  const [questionDetails, setQuestionDetails] = useState<Record<string, Question>>({});
  const [fetchingQuestions, setFetchingQuestions] = useState<boolean>(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      const testId = Array.isArray(id) ? id[0] : id;
      const getTestDetails = async () => {
        try {
          setLoading(true);
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            throw new Error("Authentication required. Please log in.");
          }
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${testId}`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch test details (${response.status})`);
          }

          const result = await response.json();
          if (!result.success || !result.data) {
            throw new Error(result.message || "Failed to load test details");
          }
          
          console.log("Test data:", JSON.stringify(result.data, null, 2));
          console.log("First question:", result.data.questions?.[0]);
          setTest(result.data);
        } catch (error: any) {
          console.error("Error fetching test details:", error);
          setError(error.message || "Failed to load test details. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      getTestDetails();
    }
  }, [id]);

  useEffect(() => {
    const fetchQuestionDetails = async () => {
      if (!test || !test.questions || test.questions.length === 0) return;
      
      const hasOnlyIds = test.questions.some(q => typeof q === 'string');
      
      if (!hasOnlyIds) return;
      
      try {
        setFetchingQuestions(true);
        const accessToken = localStorage.getItem('accessToken');
        
        if (!accessToken) {
          throw new Error("Authentication required. Please log in.");
        }
        
        const questionDetailsMap: Record<string, Question> = {};
        
        await Promise.all(
          test.questions.map(async (questionId) => {
            if (typeof questionId !== 'string') return;
            
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                  },
                }
              );
              
              if (!response.ok) {
                console.error(`Failed to fetch question ${questionId}: ${response.status}`);
                return;
              }
              
              const result = await response.json();
              if (result.success && result.data) {
                questionDetailsMap[questionId] = result.data;
                console.log(`Fetched question ${questionId}:`, result.data);
              }
            } catch (err) {
              console.error(`Error fetching question ${questionId}:`, err);
            }
          })
        );
        
        setQuestionDetails(questionDetailsMap);
      } catch (error) {
        console.error("Error fetching question details:", error);
      } finally {
        setFetchingQuestions(false);
      }
    };
    
    fetchQuestionDetails();
  }, [test]);

  // Handle click outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDelete = async () => {
    if (!test?._id) return;
    
    setIsDeleting(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Authentication required. Please log in.");
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${test._id}`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete test (${response.status})`);
      }

      router.push('/admin/tests');
    } catch (error: any) {
      console.error('Error deleting test:', error);
      setError(error.message || 'Failed to delete test. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'published' | 'archived') => {
    if (!test?._id || test.status === newStatus) return;
    
    setIsUpdatingStatus(true);
    setShowStatusDropdown(false);
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error("Authentication required. Please log in.");
      }
      
      // Simple and direct status update call
      console.log(`Updating test ${test._id} status to ${newStatus}`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${test._id}`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          changesDescription: `Status changed to ${newStatus}`
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error updating status (${response.status}):`, errorText);
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      // Fetch the updated test to ensure we have the latest data
      await refreshTestData();
      
      // Show success message
      toast.success(`Test status updated to ${newStatus}`);
      
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update status");
      
      // Refresh data to ensure UI shows the correct state
      await refreshTestData();
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Function to refresh test data
  const refreshTestData = async () => {
    if (!id) return;
    
    const testId = Array.isArray(id) ? id[0] : id;
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${testId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          console.log("Refreshed test data:", result.data);
          setTest(result.data);
          return result.data;
        }
      }
    } catch (error) {
      console.error("Error refreshing test data:", error);
    }
    return null;
  };

  const getQuestionObject = (q: Question | string): Question | null => {
    if (typeof q === 'string') {
      return questionDetails[q] || null;
    }
    return q;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Test not found.</p>
        </div>
      </div>
    );
  }

  if (fetchingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-2 text-gray-600">Loading question details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/admin/tests')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tests
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/admin/tests/edit/${id}`)}
              className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Test
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Test'}
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Test</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this test? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {test.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-500">
                <span className="inline-flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  {test.examType}
                </span>
                {test.year && (
                  <span className="inline-flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {test.year}
                  </span>
                )}
                <span className="inline-flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {test.duration} mins
                </span>
                <span className="inline-flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {test.class}
                </span>
              </div>
              {test.description && (
                <p className="mt-4 text-gray-600">{test.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                <ClipboardList className="w-4 h-4 mr-2" />
                {test.questions.length} Questions
              </div>
              <div className="mt-2 relative" ref={statusDropdownRef}>
                <button 
                  className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${
                    test.status === 'published' ? 'bg-green-100 text-green-800' : 
                    test.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                    </>
                  )}
                </button>
                
                {/* Status Dropdown */}
                {showStatusDropdown && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                    <ul className="py-1">
                      {['draft', 'published', 'archived'].map((status) => (
                        <li key={status}>
                          <button
                            onClick={() => handleStatusChange(status as 'draft' | 'published' | 'archived')}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${
                              test.status === status ? 'bg-gray-50 text-gray-800' : 'text-gray-700'
                            }`}
                            disabled={isUpdatingStatus}
                          >
                            {test.status === status && <Check className="w-3 h-3 mr-2" />}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="w-4 h-4" />
              <span>Created: {new Date(test.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CalendarDays className="w-4 h-4" />
              <span>Updated: {new Date(test.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {test.instructions && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700">{test.instructions}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Questions</h2>
          
          {test.questions.length > 0 ? (
            <div className="space-y-6">
              {test.questions.map((questionRef, index) => {
                const question = getQuestionObject(questionRef);
                
                if (!question) {
                  return (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-500">
                            {typeof questionRef === 'string' 
                              ? `Loading question details... (ID: ${questionRef})` 
                              : 'Question data is unavailable'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return (
                <div
                  key={question._id || index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-gray-900 font-medium mb-4">
                          {extractQuestionText(question)}
                        </p>
                        <span className="text-sm font-medium text-emerald-600">
                          {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                        </span>
                      </div>
                      
                      {(typeof question.question === 'object' && question.question?.image?.url) || 
                        question.image?.url ? (
                        <div className="mb-4">
                          <img 
                            src={(typeof question.question === 'object' ? question.question?.image?.url : undefined) || question.image?.url} 
                            alt="Question" 
                            className="max-w-full h-auto rounded-md border border-gray-200" 
                          />
                        </div>
                      ) : null}
                      
                      <div className="grid gap-3">
                        {(question.options || []).map((option, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg text-sm ${
                              Array.isArray(question.correctOptions)
                                ? question.correctOptions.includes(idx)
                                : idx === question.correctOption
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                : 'bg-gray-50 border border-gray-200 text-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`font-medium ${
                                Array.isArray(question.correctOptions)
                                ? question.correctOptions.includes(idx)
                                : idx === question.correctOption
                                  ? 'text-emerald-600'
                                  : 'text-gray-500'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{typeof option === 'string' ? option : option.text}</span>
                              {(Array.isArray(question.correctOptions) 
                                ? question.correctOptions.includes(idx) 
                                : idx === question.correctOption) && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                              )}
                            </div>
                            
                            {typeof option === 'object' && option.image?.url && (
                              <div className="mt-2">
                                <img 
                                  src={option.image.url} 
                                  alt={`Option ${String.fromCharCode(65 + idx)}`} 
                                  className="max-w-full h-auto rounded-md" 
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No questions available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const extractQuestionText = (question: any): string => {
  console.log("Question object:", question);
  
  if (typeof question === 'string') {
    return question;
  }
  
  if (typeof question.question === 'string') {
    return question.question;
  }
  
  if (typeof question.question === 'object' && question.question?.text) {
    return question.question.text;
  }
  
  if (question.text) {
    return question.text;
  }
  
  if (typeof question.question === 'string' && (
    question.question.startsWith('{') || 
    question.question.startsWith('[')
  )) {
    try {
      const parsed = JSON.parse(question.question);
      if (parsed.text) return parsed.text;
      if (typeof parsed === 'string') return parsed;
    } catch (e) {
      return question.question;
    }
  }
  
  for (const key in question) {
    if (typeof question[key] === 'string' && 
        question[key].length > 0 && 
        key !== '_id' && 
        key !== 'id') {
      return question[key];
    }
  }
  
  return `No question text found. Question keys: ${Object.keys(question).join(', ')}`;
};

export default TestDetailsPage;
