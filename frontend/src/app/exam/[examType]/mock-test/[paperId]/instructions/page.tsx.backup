"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { QuestionStatus } from "@/components/QuestionPaletteIcons";

type QuestionStatusType = 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked';

const Instructions = () => {
  const router = useRouter();
  const { paperId, examType } = useParams();
  const [isChecked, setIsChecked] = useState(false);
  const [testDetails, setTestDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paperId) {
      console.error("paperId is missing!");
      return;
    }

    // Fetch test details if needed
    const fetchTestDetails = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tests/${paperId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (!res.ok) {
          throw new Error("Failed to fetch test details");
        }
        const responseData = await res.json();
        if (responseData.success && responseData.data) {
          setTestDetails(responseData.data);
        }
      } catch (err) {
        console.error("Error fetching test details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [paperId]);

  const handleProceed = () => {
    if (paperId && examType) {
      router.push(`/exam/${examType}/mock-test/${paperId}/test`);
    } else {
      console.error("Invalid paperId or examType");
    }
  };

  const formatExamType = (type: string = '') => {
    const formats: Record<string, string> = {
      'cuet': 'CUET',
      'jee-mains': 'JEE Mains',
      'jee-advanced': 'JEE Advanced'
    };
    return formats[type as string] || type;
  };

  const examDuration = testDetails?.duration || 45;
  const examTitle = testDetails?.title || "CUET Mock Test";

  // Force the page body to have a light background
  useEffect(() => {
    // Add a light background to the body
    document.body.classList.add('bg-white');
    
    // Remove the class when component unmounts
    return () => {
      document.body.classList.remove('bg-white');
    };
  }, []);

  return (
    // Added specific background styles to override any parent container styles
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header - Updated styling to make it more visible */}
        <div className="bg-blue-600 p-5 mb-10 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-white tracking-wide">CUET EXAMINATION INSTRUCTIONS</h1>
        </div>

        <div className="bg-white p-6 shadow-md rounded-xl">
          <h2 className="text-center font-semibold mb-6 text-lg text-gray-800">Please read the instructions carefully before proceeding</h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-800">General Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Total duration of this CUET Mock Test is <span className="font-medium">{examDuration} minutes</span>.</li>
                <li>
                  The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.
                  When the timer reaches zero, the examination will end automatically.
                </li>
                <li>The Questions Palette displayed on the right side of screen will show the status of each question using the following symbols:</li>
              </ol>

              <div className="ml-6 mt-4 space-y-3 bg-white p-4 rounded-lg">
                {[
                  { number: 1, status: "not-visited" as QuestionStatusType },
                  { number: 2, status: "not-answered" as QuestionStatusType },
                  { number: 3, status: "answered" as QuestionStatusType },
                  { number: 4, status: "marked" as QuestionStatusType },
                  { number: 5, status: "answered-marked" as QuestionStatusType }
                ].map(({ number, status }) => (
                  <div key={number} className="flex items-center">
                    <span className="text-gray-700 w-6">{number}.</span>
                    <QuestionStatus status={status} showText={true} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-800">CUET Specific Instructions:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                <li>The CUET exam consists of multiple sections including Language Tests, Domain-specific Tests, and General Test.</li>
                <li>Some questions may have multiple correct options. Read the instructions for each question carefully.</li>
                <li>There may be negative marking for incorrect answers in some sections. Check the marking scheme carefully.</li>
                <li>You can navigate between different sections using the section tabs at the top of the test screen.</li>
                <li>You are advised to allocate your time wisely across all sections to maximize your score.</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-800">Navigating to a Question:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>To answer a question, do the following:
                  <ol className="list-[a-z] list-inside ml-6 mt-2 space-y-2">
                    <li>Click on the question number in the Question Palette to go to that numbered question directly.</li>
                    <li>Click on <span className="font-medium">Save & Next</span> to save your answer for the current question and then go to the next question.</li>
                    <li>Click on <span className="font-medium">Mark for Review & Next</span> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                  </ol>
                </li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-800">Answering a Question:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Procedure for answering a multiple choice type question:
                  <ol className="list-[a-z] list-inside ml-6 mt-2 space-y-2">
                    <li>To select your answer, click on the button of one of the options.</li>
                    <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <span className="font-medium">Clear Response</span> button.</li>
                    <li>To change your chosen answer, click on the button of another option.</li>
                    <li>To save your answer, you MUST click on the <span className="font-medium">Save & Next</span> button.</li>
                  </ol>
                </li>
                <li>To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.</li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-800">Navigating through sections:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Sections in the CUET exam are displayed on the top bar of the screen. Questions in a section can be viewed by clicking on the section name.</li>
                <li>The section you are currently viewing is highlighted.</li>
                <li>After clicking the <span className="font-medium">Save & Next</span> button on the last question for a section, you will automatically be taken to the first question of the next section.</li>
                <li>You can shuffle between sections and questions anytime during the examination as per your convenience.</li>
              </ol>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
              <p className="text-amber-700 text-sm font-medium">
                Please note all questions will appear in your default language. You can change the language for a particular question during the test if needed.
              </p>
            </div>

            <div className="border-t pt-6 mt-6">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agree"
                  className="mt-1.5 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                />
                <label htmlFor="agree" className="text-sm text-gray-700">
                  I have read and understood the instructions. I understand that this is a mock test for CUET preparation. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material during this test. I agree that in case of not adhering to the instructions, I shall be liable to be disqualified from this test.
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={handleProceed}
              disabled={!isChecked}
              className={`w-full py-3.5 text-white text-sm uppercase font-medium rounded-lg shadow-md transition-all duration-200 ${
                isChecked 
                  ? 'bg-primary hover:bg-primary-dark active:transform active:scale-[0.98]' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              PROCEED TO TEST
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;