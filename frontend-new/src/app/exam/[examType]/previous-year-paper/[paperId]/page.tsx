"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface TestDetailsType {
  title: string;
  year: string | number;
  shift: string;
  time: string | number;
  difficulty: string;
  numberOfQuestions: number;
}

const TestDetails = () => {
  const { examType, paperId } = useParams() as { examType: string; paperId: string };
  const [testDetails, setTestDetails] = useState<TestDetailsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${paperId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch test details");
        }
        const { data } = await res.json();
        setTestDetails(data);
      } catch (err: unknown) {
        console.error(err);
        setError("Error fetching test details.");
      } finally {
        setLoading(false);
      }
    };

    if (paperId) {
      fetchTestDetails();
    }
  }, [paperId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{testDetails?.title}</h1>
      <div className="mb-4">
        <p><strong>Year:</strong> {testDetails?.year}</p>
        <p><strong>Shift:</strong> {testDetails?.shift}</p>
        <p><strong>Time:</strong> {testDetails?.time}</p>
        <p><strong>Difficulty:</strong> {testDetails?.difficulty}</p>
        <p><strong>No. of Questions:</strong> {testDetails?.numberOfQuestions}</p>
      </div>
      <button
        onClick={() => router.push(`/exam/${examType}/mock-test/${paperId}/instructions`)}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
      >
        Start Test
      </button>
    </div>
  );
};

export default TestDetails;
