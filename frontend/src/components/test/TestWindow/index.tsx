"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuestionGrid from "./Navigation/QuestionGrid";
import NavigationButtons from "./Navigation/NavigationButtons";
import QuestionStatus from "./StatusPanel/QuestionStatus";
import Legend from "./StatusPanel/Legend";
import ActionButtons from "./Controls/ActionButtons";
import LanguageSelector from "./Controls/LanguageSelector";
import CandidateInfo from "./Header/CandidateInfo";
import Timer from "./Header/Timer";
import QuestionPanel from "./QuestionPanel";
// Removed unused: import { useAnalysis } from "@/context/AnalysisContext";

interface TestWindowProps {
  examType: string;
  paperId: string;
}

const TestWindow: React.FC<TestWindowProps> = ({ examType, paperId }) => {
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map());
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpentOnQuestions, setTimeSpentOnQuestions] = useState<Map<number, number>>(new Map());
  const [startTime, setStartTime] = useState<number>(Date.now());

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleQuestionIds = (ids: string[]) => setQuestionIds(ids);

  const handleNext = () => {
    const currentTime = Date.now();
    setTimeSpentOnQuestions((prev) => {
      const updated = new Map(prev);
      const timeSpent = currentTime - startTime;
      updated.set(currentQuestion, timeSpent);
      return updated;
    });
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion((prev) => prev + 1);
      setVisitedQuestions((prev) => new Set([...prev, currentQuestion]));
      setStartTime(currentTime);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSaveNext = () => {
    if (!selectedAnswers.has(currentQuestion)) {
      alert("Please choose an option before saving and moving to the next question.");
    } else {
      setAnsweredQuestions((prev) => new Set([...prev, currentQuestion]));
      handleNext();
    }
  };

  const handleClear = () => {
    setAnsweredQuestions((prev) => {
      const updated = new Set(prev);
      updated.delete(currentQuestion);
      return updated;
    });
    setSelectedAnswers((prev) => {
      const updated = new Map(prev);
      updated.delete(currentQuestion);
      return updated;
    });
  };

  const handleSaveMark = () => {
    if (!selectedAnswers.has(currentQuestion)) {
      alert("Please choose an option before marking the question for review.");
    } else {
      setAnsweredQuestions((prev) => new Set([...prev, currentQuestion]));
      setMarkedForReview((prev) => new Set([...prev, currentQuestion]));
      handleNext();
    }
  };

  const handleMarkNext = () => {
    setMarkedForReview((prev) => new Set([...prev, currentQuestion]));
    handleNext();
  };

  const handleOptionChange = (questionIndex: number, answerOptionIndex: number) => {
    setSelectedAnswers((prev) => {
      const updated = new Map(prev);
      updated.set(questionIndex, answerOptionIndex);
      return updated;
    });
    setAnsweredQuestions((prev) => {
      if (!prev.has(questionIndex)) {
        return new Set([...prev, questionIndex]);
      }
      return prev;
    });
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    console.log(`Language changed to: ${language}`);
  };

  const handleQuestionClick = (questionNumber: number) => {
    const currentTime = Date.now();
    setTimeSpentOnQuestions((prev) => {
      const updated = new Map(prev);
      const timeSpent = currentTime - startTime;
      updated.set(currentQuestion, timeSpent);
      return updated;
    });
    setCurrentQuestion(questionNumber);
    setVisitedQuestions((prev) => new Set([...prev, questionNumber]));
    setStartTime(currentTime);
  };

  // Helper function to get a cookie by name
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    console.log("Cookie value: ", value)
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";")[0] || null;
    return null;
  };

  const handleSubmit = async () => {
    if (!isClient) return;
    setIsSubmitting(true);

    // Retrieve token from cookie
    const token = getCookie("accessToken");
    console.log("Token:", token);

    if (!token) {
      alert("No authentication token found. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    // Decode JWT token (assuming standard JWT structure)
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedToken = JSON.parse(atob(base64));
    const userId = decodedToken._id;

    const totalTimeTaken = Date.now() - startTime;

    const payload = {
      paperId,
      userId,
      answers: Array.from(selectedAnswers.entries()).map(([serialNumber, optionIndex]) => {
        const questionId = questionIds[serialNumber - 1];
        return {
          questionId,
          answerOptionIndex: optionIndex,
          timeSpent: timeSpentOnQuestions.get(serialNumber) || 0,
        };
      }),
      metadata: {
        totalQuestions,
        totalTimeTaken,
        answeredQuestions: Array.from(answeredQuestions).map(
          (serialNumber) => questionIds[serialNumber - 1]
        ),
        visitedQuestions: Array.from(visitedQuestions).map(
          (serialNumber) => questionIds[serialNumber - 1]
        ),
        markedForReview: Array.from(markedForReview).map(
          (serialNumber) => questionIds[serialNumber - 1]
        ),
        selectedLanguage,
      },
    };

    console.log("Submitting payload:", payload);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attempted-tests/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      console.log("Response:", response);

      if (response.ok) {
        const result = await response.json();
        alert("Submission successful!");
        console.log("Backend response:", result);

        try {
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate async wait
          console.log("Navigating...");
          router.push(`/exam/${examType}/previous-year-paper/${paperId}/analysis/`);
          console.log("Navigation triggered!");
        } catch (routerError) {
          console.error("Router push failed, using window.location:", routerError);
          window.location.href = `/exam/${examType}/previous-year-paper/${paperId}/analysis/`;
        }
      } else {
        const errorText = await response.text();
        alert(`Submission failed: ${errorText}`);
        console.error("Error response:", errorText);
      }
    } catch (err) {
      console.error("Error submitting data:", err);
      alert("An error occurred while submitting the test. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <CandidateInfo />
        <Timer />
        <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={handleLanguageChange} />
      </header>

      <main className="flex flex-1 p-4 gap-4">
        <div className="flex flex-col flex-1 gap-4">
          <section className="bg-white border border-gray-100 rounded p-4 flex-1">
            <QuestionPanel
              examType={examType}
              paperId={paperId}
              currentQuestion={currentQuestion}
              selectedAnswers={selectedAnswers}
              handleOptionChange={handleOptionChange}
              setTotalQuestions={setTotalQuestions}
              setAnsweredQuestions={setAnsweredQuestions}
              handleQuestionIds={handleQuestionIds}
            />
          </section>

          <footer className="flex flex-col gap-2">
            <ActionButtons
              onSaveNext={handleSaveNext}
              onClear={handleClear}
              onSaveMark={handleSaveMark}
              onMarkNext={handleMarkNext}
            />

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>

            <NavigationButtons
              onNext={handleNext}
              onPrevious={handlePrevious}
              isFirstQuestion={currentQuestion === 1}
              isLastQuestion={currentQuestion === totalQuestions}
            />
          </footer>
        </div>

        <aside className="w-80 flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded p-4">
            <QuestionStatus />
            <Legend />
          </div>
          <div className="bg-white border border-gray-200 rounded p-4">
            <QuestionGrid
              totalQuestions={totalQuestions}
              answeredQuestions={answeredQuestions}
              visitedQuestions={visitedQuestions}
              markedForReview={markedForReview}
              onQuestionClick={handleQuestionClick}
              currentQuestion={currentQuestion}
            />
          </div>
        </aside>
      </main>
    </div>
  );
};

export default TestWindow;
