"use client";

import TestWindow from "@/components/test/TestWindow";
import { useParams } from "next/navigation";
import { useEffect } from "react";

const TestPage = () => {
  const { examType, paperId } = useParams();

  useEffect(() => {
    if (!examType || !paperId) {
      console.error("Missing examType or paperId parameters!");
    }
  }, [examType, paperId]);

  // Convert examType and paperId to strings (take the first element if they are arrays)
  const examTypeStr = Array.isArray(examType) ? examType[0] : examType || "";
  const paperIdStr = Array.isArray(paperId) ? paperId[0] : paperId || "";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Custom Header */}
      <header className="bg-blue-100 py-4 px-6 border-b">
        <h1 className="text-lg font-semibold">Test Window</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto p-4">
        <TestWindow examType={examTypeStr} paperId={paperIdStr} />
      </main>

      {/* No Footer */}
    </div>
  );
};

export default TestPage;
