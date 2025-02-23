"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Define the interface for a question
interface Question {
  _id: string;
  question: string;
  subject: string;
  examType: string;
  difficulty: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null); // Track which question is being deleted

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/get`;
      console.log("Fetching questions from:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();
      setQuestions(data.data || []); // Handle unexpected API structure
    } catch (err: unknown) {
      console.error("Error fetching questions:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    setDeleting(id);
    try {
      const deleteUrl = `${process.env.NEXT_PUBLIC_API_URL}/questions/delete/${id}`;
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete the question");
      }

      alert("Question deleted successfully");

      // Remove deleted question from state (faster UX instead of refetching)
      setQuestions((prevQuestions) => prevQuestions.filter((q) => q._id !== id));
    } catch (err) {
      console.error("Error deleting question:", err);
      alert("Failed to delete the question");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <h1 className="text-center mt-20 text-2xl">Loading questions...</h1>;
  if (error) return <h1 className="text-center mt-20 text-2xl text-red-600">{error}</h1>;
  if (questions.length === 0) return <h1 className="text-center mt-20 text-2xl">No questions available</h1>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-primary text-center mb-6">All Questions</h1>

      <div className="mb-6 text-right">
        <Link href="/admin/questions/add">
          <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Add New Question
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question._id} className="p-4 bg-white border rounded-lg shadow-md hover:shadow-xl">
            <h2 className="text-lg font-medium">{question.question}</h2>
            <p className="text-gray-700">Subject: {question.subject}</p>
            <p className="text-gray-700">Exam Type: {question.examType}</p>
            <p className="text-gray-700">Difficulty: {question.difficulty}</p>
            <div className="flex justify-end space-x-4 mt-4">
              <Link href={`/admin/questions/edit/${question._id}`} className="text-blue-600 hover:underline">
                Edit
              </Link>
              <button
                onClick={() => handleDelete(question._id)}
                className="text-red-600 hover:underline"
                disabled={deleting === question._id}
              >
                {deleting === question._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
