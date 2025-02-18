"use client"; // Required for client components

import React from "react";
import { useParams } from "next/navigation";
import AnalysisWindow from "../../../../../../components/analysis/AnalysisWindow";

const AnalysisPage = () => {
  const { paperId } = useParams(); // Extract paperId from the URL
  if (!paperId) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <AnalysisWindow paperId={paperId as string} />
    </div>
  );
};

export default AnalysisPage;
