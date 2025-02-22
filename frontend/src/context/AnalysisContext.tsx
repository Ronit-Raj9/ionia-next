"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

/** Define the structure of your analysis data based on your backend response */
export interface AnalysisData {
  marksObtained: number;
  questionsAttempted: number;
  accuracy: string;       // e.g. "7.14"
  timeSpent: string;      // e.g. "195.95"
  totalQuestions: number;
  // Add any additional fields if needed
}

interface AnalysisContextType {
  analysisData: AnalysisData | null;
  setAnalysisData: (data: AnalysisData) => void;
  subject: string;
  setSubject: (subject: string) => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const useAnalysis = (): AnalysisContextType => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  return context;
};

interface AnalysisProviderProps {
  children: ReactNode;
}

export const AnalysisProvider = ({ children }: AnalysisProviderProps) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [subject, setSubject] = useState<string>("Overall");
  console.log("analysisData from AnalysisContext:", analysisData);

  return (
    <AnalysisContext.Provider
      value={{
        analysisData,
        setAnalysisData,
        subject,
        setSubject,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};
