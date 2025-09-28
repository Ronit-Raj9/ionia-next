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
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary text-center mb-4 sm:mb-6 px-2">
          {details.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-700 text-center mb-8 sm:mb-10 px-4 max-w-3xl mx-auto">
          {details.description}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          {details.subjects.map((subject) => (
            <Link
              key={subject}
              href={`/exam/${examType}/${subject.toLowerCase()}`}
              className="block p-4 sm:p-6 bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 w-full"
            >
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-center text-primary break-words">
                {subject}
              </h2>
            </Link>
          ))}
          <Link
            href={`/exam/${examType}/previous-year-paper`}
            className="block p-4 sm:p-6 bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 w-full"
          >
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-center text-primary break-words">
              Previous Year Paper
            </h2>
          </Link>
          <Link
            href={`/exam/${examType}/mock-test`}
            className="block p-4 sm:p-6 bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 w-full"
          >
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-center text-primary break-words">
              Mock Test
            </h2>
          </Link>
        </div>
      </div>
    </div>
  );
}
