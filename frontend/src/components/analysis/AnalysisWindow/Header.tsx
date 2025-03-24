"use client"; // This marks the component as a client-side component

import { useState, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface TestInfo {
  testName?: string;
  attemptNumber?: number;
  attempts?: string[];
}

interface HeaderProps {
  testInfo: TestInfo;
}

const Header: React.FC<HeaderProps> = ({ testInfo = {} }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState("");
  const attempts: string[] = testInfo?.attempts || [`Attempt ${testInfo?.attemptNumber || 1}`];

  // Set the default selected attempt when attempts are available
  useEffect(() => {
    if (attempts.length > 0 && !selectedAttempt) {
      setSelectedAttempt(attempts[attempts.length - 1]);
    }
  }, [attempts, selectedAttempt]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const selectAttempt = (attempt: string) => {
    setSelectedAttempt(attempt);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Left Section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analysis Report</h1>
            <p className="text-sm text-gray-500">{testInfo?.testName || 'Test Analysis'}</p>
          </div>

          {/* Right Section */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Solution Button */}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium">
              View Solution
            </button>

            {/* Reattempt Button */}
            <button className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors text-sm font-medium">
              Reattempt
            </button>

            {/* Dropdown */}
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md shadow-sm hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <span className="mr-1">{selectedAttempt || "No Attempts"}</span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10 py-1">
                  {attempts.map((attempt: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => selectAttempt(attempt)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        selectedAttempt === attempt ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      {attempt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
