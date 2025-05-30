"use client";

import React from "react";

interface CandidateInfoProps {
  name: string;
  testName: string;
}

const CandidateInfo: React.FC<CandidateInfoProps> = ({ name, testName }) => {
  return (
    <div className="flex items-center">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-gray-900">{name}</span>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>{testName}</span>
        </div>
      </div>
    </div>
  );
};

export default CandidateInfo;
