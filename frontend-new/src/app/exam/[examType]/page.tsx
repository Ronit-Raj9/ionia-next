"use client";
import { useParams } from "next/navigation";
import Link from "next/link";

// Define a union type for valid exam keys.
type ExamKey = "jee-mains" | "jee-advanced" | "cuet";

export default function ExamTypePage() {
  const params = useParams();
  let { examType } = params || {};

  // If examType is an array, use the first element.
  if (Array.isArray(examType)) {
    examType = examType[0];
  }

  // Check that examType is defined and a string.
  if (!examType || typeof examType !== "string") {
    return <h1 className="text-center mt-20 text-2xl">Exam Type Not Found</h1>;
  }

  // Define exam details with a typed record.
  const examDetails: Record<ExamKey, { title: string; description: string; subjects: string[] }> = {
    "jee-mains": {
      title: "JEE Mains Test Series",
      description: "Comprehensive practice for JEE Mains",
      subjects: ["Physics", "Chemistry", "Mathematics"],
    },
    "jee-advanced": {
      title: "JEE Advanced Test Series",
      description: "Challenging preparation for JEE Advanced",
      subjects: ["Physics", "Chemistry", "Mathematics"],
    },
    cuet: {
      title: "CUET Test Series",
      description: "Focused practice for CUET exams",
      subjects: ["Physics", "Chemistry", "Mathematics", "English", "General Knowledge"],
    },
  };

  // Validate that examType is a valid key.
  if (!(examType in examDetails)) {
    return <h1 className="text-center mt-20 text-2xl">Exam Type Not Found</h1>;
  }

  // Cast examType to the valid union type.
  const details = examDetails[examType as ExamKey];

  return (
    <div className="other-container container mx-auto p-6 mt-10">
      <h1 className="text-3xl font-bold text-primary text-center mb-6">{details.title}</h1>
      <p className="text-lg text-gray-700 text-center">{details.description}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {details.subjects.map((subject) => (
          <Link
            key={subject}
            href={`/exam/${examType}/${subject.toLowerCase()}`}
            className="block p-6 bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
          >
            <h2 className="text-2xl font-semibold text-center text-primary">{subject}</h2>
          </Link>
        ))}
        <Link
          href={`/exam/${examType}/mock-test`}
          className="block p-6 bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
        >
          <h2 className="text-2xl font-semibold text-center text-primary">Previous Year Paper</h2>
        </Link>
        <Link
          href={`/exam/${examType}/mock-test`}
          className="block p-6 bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
        >
          <h2 className="text-2xl font-semibold text-center text-primary">Mock Test</h2>
        </Link>
      </div>
    </div>
  );
}
