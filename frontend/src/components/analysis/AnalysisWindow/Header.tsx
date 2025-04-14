"use client"; // This marks the component as a client-side component

import { useState, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface TestInfo {
  testName?: string;
  attemptNumber?: number;
  attempts?: string[];
  testId?: string;
  examType?: string;
  paperId?: string;
  attemptsList?: {id: string, number: number}[];
  attemptId?: string;
}

interface HeaderProps {
  testInfo: TestInfo;
  onAttemptChange?: (attemptId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ testInfo = {}, onAttemptChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const attempts: string[] = testInfo?.attempts || [`Attempt ${testInfo?.attemptNumber || 1}`];
  const attemptsList = testInfo?.attemptsList || [];
  const router = useRouter();

  // Set the default selected attempt when attempts are available
  useEffect(() => {
    if (attempts.length > 0 && !selectedAttempt) {
      setSelectedAttempt(attempts[attempts.length - 1]);
    }
  }, [attempts, selectedAttempt]);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  
  const selectAttempt = (attempt: string, index: number) => {
    setSelectedAttempt(attempt);
    setIsDropdownOpen(false);
    
    // Call the parent's callback function with the selected attempt ID
    if (onAttemptChange && attemptsList.length > 0 && index < attemptsList.length) {
      onAttemptChange(attemptsList[index].id);
    }
  };

  const handleReattempt = () => {
    setShowConfirmDialog(true);
  };

  const confirmReattempt = () => {
    setShowConfirmDialog(false);
    // Navigate to test page
    const examType = testInfo.examType || "general";
    const paperId = testInfo.paperId;
    if (paperId) {
      router.push(`/exam/${examType}/mock-test/${paperId}/instructions`);
    }
  };

  const cancelReattempt = () => {
    setShowConfirmDialog(false);
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
            <button 
              onClick={() => {
                const examType = testInfo.examType || 'general';
                const paperId = testInfo.paperId || '';
                const attemptId = testInfo.attemptId || '';
                const testType = examType.includes('previous') ? 'previous-year-paper' : 'mock-test';
                router.push(`/exam/${examType}/${testType}/${paperId}/solution?attemptId=${attemptId}`);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Solution
            </button>

            {/* Reattempt Button */}
            <button 
              onClick={handleReattempt}
              className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors text-sm font-medium"
            >
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
                      onClick={() => selectAttempt(attempt, index)}
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

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Reattempt</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reattempt this test? Your new attempt will be recorded separately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelReattempt}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReattempt}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Reattempt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
