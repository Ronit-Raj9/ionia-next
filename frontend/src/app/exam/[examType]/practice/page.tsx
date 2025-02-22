"use client";

import { useParams } from "next/navigation";

export default function PracticePage() {
  const params = useParams();
  const { testType } = params || {};

  // Convert testType to a string and provide a default if undefined.
  const testTypeStr = typeof testType === "string" ? testType.toUpperCase() : "UNKNOWN";

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-primary text-center mb-6">
        Practice Tests for {testTypeStr}
      </h1>
      <p className="text-lg text-gray-700 text-center">
        Here you can find practice tests and quizzes for {typeof testType === "string" ? testType : "unknown"}.
      </p>
    </div>
  );
}
