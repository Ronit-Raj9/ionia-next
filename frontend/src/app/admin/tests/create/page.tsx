"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Question {
  _id: string;
  question: string;
  options: string[];
  correctOption: number;
  examType: string;
  subject: string;
  sectionPhysics: string;
  sectionChemistry: string;
  sectionMathematics: string;
  difficulty: string;
  year: string;
}

export default function CreateTestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);

  // Metadata for the test
  const [testTitle, setTestTitle] = useState("");
  const [testExamType, setTestExamType] = useState("");
  const [testYear, setTestYear] = useState("");
  const [testTime, setTestTime] = useState("");
  const [testShift, setTestShift] = useState("");

  // Filters for selecting questions
  const [filterExamType, setFilterExamType] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/get`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data = await res.json();
        const allQuestions = data.data || [];

        setQuestions(allQuestions);
        setFilteredQuestions(allQuestions);

        // Extract unique subjects (in lowercase) and years
        const uniqueSubjects = Array.from(
          new Set(
            allQuestions.map((q: Question) =>
              typeof q.subject === "string" ? q.subject.toLowerCase() : ""
            )
          )
        ) as string[];

        const uniqueYears = Array.from(
          new Set(allQuestions.map((q: Question) => q.year))
        ).filter(Boolean) as string[];

        setSubjects(uniqueSubjects);
        setYears(uniqueYears);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    }
    loadQuestions();
  }, []);

  useEffect(() => {
    let filtered = questions;

    if (filterExamType) {
      filtered = filtered.filter((q) => q.examType === filterExamType);
    }
    if (filterYear) {
      filtered = filtered.filter((q) => q.year === filterYear);
    }
    if (filterSubject) {
      filtered = filtered.filter((q) => q.subject === filterSubject);
    }
    if (filterDifficulty) {
      filtered = filtered.filter((q) => q.difficulty === filterDifficulty);
    }

    // Search works independently of filters
    if (searchTerm.trim()) {
      filtered = questions.filter((q) =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQuestions(filtered);
  }, [filterExamType, filterYear, filterSubject, filterDifficulty, searchTerm, questions]);

  const handleCreateTest = async () => {
    if (!testTitle || !testExamType || !testYear || !testShift || !testTime || selectedQuestions.length === 0) {
      alert("Please fill in all fields and select at least one question.");
      return;
    }

    setLoading(true);
    try {
      const testData = {
        examType: testExamType,
        year: testYear,
        title: testTitle,
        time: testTime,
        shift: testShift,
        questions: selectedQuestions,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/previous-year-papers/add`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Test series created successfully!");
        router.push("/admin/tests");
      } else {
        alert(result.message || "Error creating test series");
      }
    } catch (error) {
      console.error("Error creating test series:", error);
      alert("Error creating test series");
    }
    setLoading(false);
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleMetadataSubmit = () => {
    if (!testTitle || !testExamType || !testYear || !testTime || !testShift) {
      alert("Please fill in all test metadata fields.");
      return;
    }
    setShowFilters(true);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Create Test Series</h1>

      <form className="space-y-6">
        {/* Test Metadata Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">Title</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold">Exam Type</label>
              <select
                className="w-full p-2 border rounded"
                value={testExamType}
                onChange={(e) => setTestExamType(e.target.value)}
                required
              >
                <option value="">Select Exam Type</option>
                <option value="jee-mains">JEE Mains</option>
                <option value="jee-advanced">JEE Advanced</option>
                <option value="cuet">CUET</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold">Year</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                list="years"
                placeholder="Year"
                value={testYear}
                onChange={(e) => setTestYear(e.target.value)}
                required
              />
              <datalist id="years">
                {years.map((y) => (
                  <option key={y} value={y} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block font-semibold">Time (e.g., 120 minutes)</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={testTime}
                onChange={(e) => setTestTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold">Shift (e.g., Morning/Evening)</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={testShift}
                onChange={(e) => setTestShift(e.target.value)}
                required
              />
            </div>
          </div>
          <button
            type="button"
            className="mt-4 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleMetadataSubmit}
          >
            Next: Select Questions
          </button>
        </div>

        {/* Filters and Questions Section */}
        {showFilters && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <select
                className="p-2 border rounded"
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <option value="">Select Subject</option>
                {subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>

              <select
                className="p-2 border rounded"
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                <option value="">Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>

              <input
                type="text"
                className="p-2 border rounded"
                placeholder="Search Questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <select
                className="p-2 border rounded"
                value={filterExamType}
                onChange={(e) => setFilterExamType(e.target.value)}
              >
                <option value="">Select Exam Type</option>
                <option value="jee-mains">JEE Mains</option>
                <option value="jee-advanced">JEE Advanced</option>
                <option value="cuet">CUET</option>
              </select>

              <input
                type="text"
                className="p-2 border rounded"
                placeholder="Year"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              />
            </div>

            <h2 className="text-xl mt-6 font-semibold">
              Select Questions ({selectedQuestions.length} selected)
            </h2>

            <div className="border p-4 max-h-96 overflow-y-auto">
              {filteredQuestions.length === 0 ? (
                <p className="text-gray-600">No questions available.</p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredQuestions.map((question) => (
                    <li key={question._id} className="border p-3 rounded-lg">
                      <input
                        type="checkbox"
                        id={question._id}
                        checked={selectedQuestions.includes(question._id)}
                        onChange={() => handleQuestionSelect(question._id)}
                        className="mr-2"
                      />
                      <label htmlFor={question._id} className="cursor-pointer block">
                        <strong>{question.subject}</strong> - {question.question}
                        <div className="mt-2">
                          {question.options.map((option, index) => (
                            <div
                              key={index}
                              className={`ml-4 ${
                                index === question.correctOption
                                  ? "text-green-600 font-bold"
                                  : "text-gray-700"
                              }`}
                            >
                              {String.fromCharCode(65 + index)}. {option}
                            </div>
                          ))}
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              className="w-full p-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleCreateTest}
              disabled={loading}
            >
              {loading ? "Creating Test..." : "Create Test Series"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
