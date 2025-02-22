"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchTests } from "../utils/api"; // Ensure this function exists and fetches data

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
        const response = await fetchTests(); // Fetch the test data
        console.log("Mera sara test ka response: ", response); // Debugging log to see the full response structure
        setResponseData(response.data); // Directly store the 'data' from the response
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    }
    getTests();
  }, []);

  if (loading) {
    return <p>Loading tests...</p>;
  }

  if (!responseData) {
    return <p>No tests data available.</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-primary text-center mb-6">
        Previous Year Tests
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {responseData.map((test: Test) => {
          console.log("Test ka id: ", `/admin/tests/view/${test._id}`);
          return (
            <div
              key={test._id}
              className="bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex items-center space-x-6 w-full"
            >
              <div className="w-1/4 relative">
                <Image
                  src="/placeholder-image.jpg"
                  alt="Test Icon"
                  className="rounded-lg w-full h-auto object-cover"
                  width={100}
                  height={100}
                />
              </div>
              <div className="flex flex-col w-3/4">
                <h2 className="text-2xl font-semibold">
                  {test.title} - {test.year}
                </h2>
                <p className="text-gray-600">Year: {test.year}</p>
                <p className="text-gray-600">Shift: {test.shift}</p>
                <p className="text-gray-600">Time: {test.time} minutes</p>
                <p className="text-gray-600">
                  Number of Questions: {test.numberOfQuestions}
                </p>
                <Link
                  href={`/admin/tests/view/${test._id}`}
                  className="block mt-4 text-primary font-semibold"
                >
                  View Test Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
