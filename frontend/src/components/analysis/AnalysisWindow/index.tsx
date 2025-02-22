"use client";

import React, { useEffect, useState } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import Summary from "./Summary";
import AttemptsAnalysis from "./AttemptsAnalysis";
import QualityTimeSpent from "./QualityTimeSpent";
import SubjectWiseTime from "./SubjectWiseTime";

interface AnalysisWindowProps {
  paperId: string;
}

const AnalysisWindow: React.FC<AnalysisWindowProps> = ({ paperId }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paperId) {
      setError("Paper ID not found");
    }
  }, [paperId]);

  if (error) return <div>{error}</div>;

  console.log("Paper ID:", paperId);

  return (
      <div className="max-w-7xl mx-auto bg-white shadow-md rounded-lg p-8 space-y-6">
        <Header />
        <Tabs />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Summary />
          <AttemptsAnalysis />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QualityTimeSpent />
          <SubjectWiseTime />
        </div>
      </div>
  );
};

export default AnalysisWindow;
