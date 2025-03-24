"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchTestDetails, deleteTest } from "../../../utils/api";
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
  Trash2
} from "lucide-react";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctOption: number;
}

interface Test {
  _id: string;
  examType: string;
  title: string;
  year: number;
  time: string;
  shift: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  numberOfQuestions: number;
}

const TestDetailsPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      const testId = Array.isArray(id) ? id[0] : id;
      const getTestDetails = async () => {
        try {
          const response = await fetchTestDetails(testId);
          const data = response?.data;
          setTest(data || null);
        } catch (error) {
          console.error("Error fetching test details:", error);
          setError("Failed to load test details. Please try again.");
        } finally {
          setLoading(false);
        }
      };
      getTestDetails();
    }
  }, [id]);

  const handleDelete = async () => {
    if (!test?._id) return;
    
    setIsDeleting(true);
    try {
      await deleteTest(test._id);
      router.push('/admin/tests');
    } catch (error) {
      console.error('Error deleting test:', error);
      setError('Failed to delete test. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation and Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/admin/tests')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Tests
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

        {/* Delete Confirmation Modal */}
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

        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {test.title}
              </h1>
              <div className="flex items-center gap-4 text-gray-500">
                <span className="inline-flex items-center">
                  <GraduationCap className="w-4 h-4 mr-1" />
                  {test.examType}
                </span>
                <span className="inline-flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {test.year}
                </span>
                <span className="inline-flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {test.time}
                </span>
                <span className="inline-flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {test.shift} Shift
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                <ClipboardList className="w-4 h-4 mr-2" />
                {test.numberOfQuestions} Questions
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

        {/* Questions Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Questions</h2>
          
          {test.questions.length > 0 ? (
            <div className="space-y-6">
              {test.questions.map((question, index) => (
                <div
                  key={question._id || index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium mb-4">
                        {question.question}
                      </p>
                      <div className="grid gap-3">
                        {question.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg text-sm ${
                              idx === question.correctOption
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                : 'bg-gray-50 border border-gray-200 text-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`font-medium ${
                                idx === question.correctOption
                                  ? 'text-emerald-600'
                                  : 'text-gray-500'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{option}</span>
                              {idx === question.correctOption && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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

export default TestDetailsPage;
