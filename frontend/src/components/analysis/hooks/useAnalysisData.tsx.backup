// analysis/hooks/useAnalysisData.ts
"use client";
import { useState } from "react";

export const useAnalysisData = () => {
  // Dummy data structure
  const dummyData = [
    { id: "1", name: "Math", score: 85, timeSpent: 120 },
    { id: "2", name: "Science", score: 92, timeSpent: 90 },
  ];

  const [data] = useState(dummyData);
  const [subject, setSubject] = useState("Math");
  const [loading] = useState(false);
  const [error] = useState(null);

  return { data, subject, setSubject, loading, error };
};
