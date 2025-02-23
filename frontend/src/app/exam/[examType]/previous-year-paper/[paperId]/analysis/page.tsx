"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import AnalysisWindow from "../../../../../../components/analysis/AnalysisWindow";
import { useAnalysis } from "@/context/AnalysisContext";

const AnalysisPageContent = ({ paperId }: { paperId: string }) => {
  const { setAnalysisData } = useAnalysis();

  // Helper to get a cookie value by name
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";")[0] || null;
    return null;
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
  

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/attempted-tests/analysis?paperId=${paperId}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("response:", response);

        if (response.ok) {
          const result = await response.json();
          console.log("result:", result);
          if (result.success && result.data && result.data.length > 0) {
            const latestAttempt = result.data[0]; // Get the most recent attempt

            setAnalysisData({
              marksObtained: latestAttempt.totalCorrectAnswers,
              questionsAttempted:
                latestAttempt.totalCorrectAnswers + latestAttempt.totalWrongAnswers,
              accuracy: (
                (latestAttempt.totalCorrectAnswers /
                  (latestAttempt.totalCorrectAnswers + latestAttempt.totalWrongAnswers)) *
                100 || 0
              ).toFixed(2),
              timeSpent: (latestAttempt.totalTimeTaken / 1000).toFixed(2), // Convert ms to seconds
              totalQuestions: latestAttempt.totalQuestions,
            });

            console.log("Fetched analysis data:", latestAttempt);
          } else {
            console.warn("No previous test attempt data found.");
          }
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch analysis data:", errorText);
        }
      } catch (error) {
        console.error("Error fetching analysis data:", error);
      }
    };

    fetchAnalysis();
  }, [paperId, setAnalysisData]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <AnalysisWindow paperId={paperId} />
    </div>
  );
};

const AnalysisPage = () => {
  const { paperId } = useParams();
  console.log("analysis page paperId:", paperId);
  if (!paperId) return <div>Loading...</div>;

  return (
      <AnalysisPageContent paperId={paperId as string} />
  );
};

export default AnalysisPage;
