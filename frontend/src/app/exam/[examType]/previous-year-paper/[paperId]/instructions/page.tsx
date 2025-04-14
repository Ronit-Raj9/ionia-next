"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { QuestionStatus } from "@/components/QuestionPaletteIcons";

type QuestionStatusType = 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked';

const Instructions = () => {
  const router = useRouter();
  const { paperId, examType } = useParams();
  const [isChecked, setIsChecked] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  useEffect(() => {
    if (!paperId) {
      console.error("paperId is missing!");
    }
  }, [paperId]);

  const handleProceed = () => {
    if (paperId && examType) {
      router.push(`/exam/${examType}/mock-test/${paperId}/test`);
    } else {
      console.error("Invalid paperId or examType");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Language Selection */}
      <div className="flex justify-end p-4 border-b bg-white">
        <div className="flex items-center">
          <span className="mr-2 text-sm">Choose Your Default Language</span>
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-gray-100 p-4 mb-6">
          <h1 className="text-lg font-bold uppercase">GENERAL INSTRUCTIONS</h1>
        </div>

        <div className="bg-white p-6 shadow-sm rounded">
          <h2 className="text-center font-medium mb-6">Please read the instructions carefully</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">General Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Total duration of JEE-Main - 405503616_BTECH 8th Jan 2020 Shift 1 is 180 min.</li>
                <li>
                  The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination.
                  When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.
                </li>
                <li>The Questions Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</li>
              </ol>

              <div className="ml-6 mt-4 space-y-3">
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

            <div>
              <h3 className="font-medium mb-2">Navigating to a Question:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>To answer a question, do the following:
                  <ol className="list-[a-z] list-inside ml-6 mt-2 space-y-2">
                    <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                    <li>Click on Save & Next to save your answer for the current question and then go to the next question.</li>
                    <li>Click on Mark for Review & Next to save your answer for the current question, mark it for review, and then go to the next question.</li>
                  </ol>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium mb-2">Answering a Question:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Procedure for answering a multiple choice type question:
                  <ol className="list-[a-z] list-inside ml-6 mt-2 space-y-2">
                    <li>To select your answer, click on the button of one of the options.</li>
                    <li>To deselect your chosen answer, click on the button of the chosen option again or click on the Clear Response button</li>
                    <li>To change your chosen answer, click on the button of another option</li>
                    <li>To save your answer, you MUST click on the Save & Next button.</li>
                    <li>To mark the question for review, click on the Mark for Review & Next button.</li>
                  </ol>
                </li>
                <li>To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium mb-2">Navigating through sections:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Sections in this question paper are displayed on the top bar of the screen. Questions in a section can be viewed by click on the section name. The section you are currently viewing is highlighted.</li>
                <li>After clicking the Save & Next button on the last question for a section, you will automatically be taken to the first question of the next section.</li>
                <li>You can shuffle between sections and questions anything during the examination as per your convenience only during the time stipulated.</li>
                <li>Candidate can view the corresponding section summary as part of the legend that appears in every section above the question palette.</li>
              </ol>
            </div>

            <div className="text-red-500 text-sm">
              Please note all questions will appear in your default language. This language can be changed for a particular question later on.
            </div>

            <div className="border-t pt-4">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="agree"
                  className="mt-1"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                />
                <label htmlFor="agree" className="text-sm">
                  I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleProceed}
              disabled={!isChecked}
              className={`w-full py-3 text-white text-sm uppercase font-medium rounded ${
                isChecked ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              PROCEED
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instructions;