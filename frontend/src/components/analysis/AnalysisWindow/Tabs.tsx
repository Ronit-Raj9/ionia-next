"use client";
import React from "react";
import { useAnalysis } from "@/context/AnalysisContext"; // Ensure your AnalysisContext exports subject and setSubject

const Tabs: React.FC = () => {
  const { subject, setSubject } = useAnalysis();
  const tabs = ["Overall", "Physics", "Chemistry", "Mathematics"];

  return (
    <div className="flex space-x-4 border-b-2 border-gray-200 pb-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setSubject(tab)}
          className={`text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md focus:outline-none ${
            subject === tab ? "border-b-2 border-blue-600" : ""
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
