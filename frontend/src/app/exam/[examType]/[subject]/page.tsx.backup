"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Question {
  question: string;
  options: string[];
  // You can add additional fields if needed, e.g. id, correctOption, etc.
}

export default function SubjectPage() {
  const params = useParams();
  const { examType, subject } = params || {};
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch questions from the API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log(examType, subject);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/questions/get?examType=${examType}&subject=${subject}`
        );
        const data = await response.json();
        console.log("Fetched questions: ", data);
        setQuestions(data.data); // Ensure you are using data.data if it exists
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [examType, subject]);

  if (loading) {
    return <h1 className="text-center mt-20 text-2xl">Loading questions...</h1>;
  }

  if (!questions.length) {
    return (
      <h1 className="text-center mt-20 text-2xl">
        No questions available for {subject || "unknown subject"}
      </h1>
    );
  }

  // Safely create display strings for subject and examType.
  const subjectDisplay =
    typeof subject === "string" && subject.length > 0
      ? subject.charAt(0).toUpperCase() + subject.slice(1)
      : "Unknown Subject";
  const examTypeDisplay =
    typeof examType === "string" && examType.length > 0
      ? examType.toUpperCase()
      : "UNKNOWN";

  return (
    <div className="container mx-auto p-6">
      {/* Heading for the subject */}
      <h1 className="text-3xl font-bold text-primary text-center mb-6">
        Questions for {subjectDisplay} - {examTypeDisplay}
      </h1>

      {/* Link to the practice page */}
      <div className="text-center mb-6">
        <Link
          href={`/exam/${examType}/${subject}/practice`}
          className="text-blue-600 hover:underline text-lg"
        >
          Go to Practice
        </Link>
      </div>

      {/* Display the questions */}
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={index} className="p-4 bg-white border rounded-lg shadow-md">
            <h2 className="text-lg font-medium">
              {index + 1}. {question.question}
            </h2>
            <ul className="mt-2 space-y-2">
              {question.options.map((option, i) => (
                <li key={i} className="pl-4">
                  {String.fromCharCode(65 + i)}. {option}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
