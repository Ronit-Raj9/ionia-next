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
          <span className="text-lg font-semibold text-gray-900">{name}</span>
          <span className="text-gray-400">-</span>
          <span className="text-lg font-semibold text-gray-900">{testName}</span>
        </div>
      </div>
    </div>
  );
};

export default CandidateInfo;
