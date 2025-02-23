"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type QuestionDataType = {
  question: string;
  options: string[];
  correctOption: number;
  examType: string;
  subject: string;
  sectionPhysics?: string; // Optional if not always required
  sectionChemistry?: string;
  sectionMathematics?: string;
  difficulty: string;
  year: string;
  languageLevel: string;
  solutionMode: string;
};


export default function EditQuestion() {
  const [questionData, setQuestionData] = useState<QuestionDataType>({
    question: "",
    options: ["", "", "", ""], // Default 4 options
    correctOption: 0,
    examType: "",
    subject: "",
    sectionPhysics: "", // Keeping consistent with type definition
    sectionChemistry: "",
    sectionMathematics: "",
    difficulty: "",
    year: "not applicable",
    languageLevel: "",
    solutionMode: "",
  });
  

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  
  const id = params?.questionId; // Extract question ID from route params

  // Fetch question data
  useEffect(() => {
    if (!id) return;

    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/questions/get/${id}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch question data. Status: ${response.status}`);
        }

        const data = await response.json();
        
        setQuestionData({
          ...data.data,
          options: data.data?.options || ["", "", "", ""], // Ensure options is always an array
        });
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [id]);

  // Handle input changes for normal fields and options array
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index?: number
  ) => {
    const { name, value } = e.target;
  
    if (index !== undefined) {
      const newOptions = [...(questionData.options || ["", "", "", ""])];
      newOptions[index] = value;
      setQuestionData((prev) => ({ ...prev, options: newOptions }));
    } else {
      setQuestionData((prev) => ({ ...prev, [name]: value }));
    }
  };
  

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      console.log("Updating question:", questionData);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/questions/update/${id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        }
      );
  
      if (!response.ok) {
        throw new Error(`Failed to update question. Status: ${response.status}`);
      }
  
      alert("✅ Question updated successfully!");
      router.push("/admin/questions");
    } catch (err) {
      if (err instanceof Error) {
        alert(`❌ Error: ${err.message}`);
      } else {
        alert("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  
  

  if (error) {
    return <h1 className="text-center text-red-600">{error}</h1>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-primary text-center mb-6">Edit Question</h1>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Field */}
          <div>
            <label className="block text-lg">Question</label>
            <input 
              type="text" 
              name="question" 
              value={questionData.question} 
              onChange={handleInputChange} 
              className="w-full px-4 py-2 border rounded-md" 
              required 
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-lg">Options</label>
            {questionData.options?.map((option, index) => (
              <input 
                key={index} 
                type="text" 
                value={option} 
                onChange={(e) => handleInputChange(e, index)} 
                className="w-full px-4 py-2 border rounded-md mb-2" 
                placeholder={`Option ${String.fromCharCode(65 + index)}`} 
                required 
              />
            ))}
          </div>

          {/* Correct Option */}
          <div>
            <label className="block text-lg">Correct Option (0-3)</label>
            <input 
              type="number" 
              name="correctOption" 
              value={questionData.correctOption} 
              onChange={handleInputChange} 
              className="w-full px-4 py-2 border rounded-md" 
              required 
              min="0" 
              max="3" 
            />
          </div>

          {/* Additional Fields */}
          {[
            "examType",
            "subject",
            "sectionPhysics",
            "sectionChemistry",
            "sectionMathematics",
            "difficulty",
            "year",
            "languageLevel",
            "solutionMode",
          ].map((field) => (
            <div key={field}>
              <label className="block text-lg capitalize">
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                type="text"
                name={field}
                value={questionData[field as keyof QuestionDataType] || ""}  // ✅ Explicitly define as keyof QuestionDataType
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md"
                required
              />
            </div>
          ))}


          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700" 
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Question"}
          </button>
        </form>
      )}
    </div>
  );
}
