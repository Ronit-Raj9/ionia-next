"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Clock, BookOpen, CalendarDays, Loader2 } from "lucide-react";
import { fetchTests } from "../utils/api";

interface Test {
  _id: string;
  title: string;
  year: number;
  shift: string;
  time: number;
  numberOfQuestions: number;
}

export default function TestPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [responseData, setResponseData] = useState<Test[] | null>(null);

  useEffect(() => {
    async function getTests() {
      try {
        const response = await fetchTests();
        setResponseData(response.data);
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    }
    getTests();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!responseData?.length) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
          <Link
            href="/admin/tests/create"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Test
          </Link>
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ClipboardList className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Tests Available</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first test.</p>
          <Link
            href="/admin/tests/create"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Test
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tests</h1>
        <Link
          href="/admin/tests/create"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Test
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {responseData.map((test: Test) => (
          <div
            key={test._id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg group-hover:bg-emerald-600 transition-colors">
                  <ClipboardList className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                    {test.title}
                  </h2>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600 gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Year: {test.year}</span>
                    </div>
                    <div className="flex items-center text-gray-600 gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{test.time} minutes</span>
                    </div>
                    <div className="flex items-center text-gray-600 gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{test.numberOfQuestions} Questions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <Link
                href={`/admin/tests/view/${test._id}`}
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-emerald-600 font-medium hover:bg-emerald-600 hover:text-white hover:border-transparent transition-colors"
              >
                View Test Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
