"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

interface OptionProps {
  option: string;
  optionIndex: number;
  questionNumber: number;
  selectedAnswer: number | undefined;
  handleOptionChange: (questionNumber: number, answerIndex: number) => void;
}

const QuestionOptions: React.FC<OptionProps> = ({
  option,
  optionIndex,
  questionNumber,
  selectedAnswer,
  handleOptionChange,
}) => (
  <div className="flex items-center space-x-2">
    <input
      type="radio"
      id={`option-${questionNumber}-${optionIndex}`}
      name={`question-${questionNumber}`}
      value={option}
      checked={selectedAnswer === optionIndex}
      onChange={() => handleOptionChange(questionNumber, optionIndex)}
      className="form-radio text-blue-600"
    />
    <label htmlFor={`option-${questionNumber}-${optionIndex}`} className="text-md">
      {option}
    </label>
  </div>
);

interface Question {
  _id: string;
  question: string;
  options: string[];
}

interface ApiResponse {
  data: {
    questions: Question[];
  };
}

interface QuestionPanelProps {
  examType: string;
  paperId: string;
  currentQuestion: number;
  selectedAnswers: Map<number, number>;
  handleOptionChange: (questionIndex: number, answerOptionIndex: number, questionId: string) => void;
  setTotalQuestions: (total: number) => void;
  setAnsweredQuestions: (answered: Set<number>) => void;
  handleQuestionIds: (ids: string[]) => void;
}

const QuestionPanel: React.FC<QuestionPanelProps> = React.memo(
  ({
    paperId,
    currentQuestion,
    selectedAnswers,
    handleOptionChange,
    setTotalQuestions,
    handleQuestionIds,
  }) => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const hasFetchedData = useRef(false);

    useEffect(() => {
      if (hasFetchedData.current) return;
      hasFetchedData.current = true;

      const fetchData = async () => {
        try {
          const response = await axios.get<ApiResponse>(
            `http://localhost:4000/api/v1/previous-year-papers/get/${paperId}`
          );

          const questionData: Question[] = response.data.data.questions;
          setQuestions(questionData);

          const ids = questionData.map((question) => question._id);
          handleQuestionIds(ids);

          setTotalQuestions(questionData.length);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching data:", error);
          setLoading(false);
        }
      };

      fetchData();
    }, [paperId, setTotalQuestions, handleQuestionIds]);

    if (loading) return <p>Loading questions...</p>;

    const currentQuestionData = questions[currentQuestion - 1];

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Question {currentQuestion}</h3>
        <p className="text-md mb-6">{currentQuestionData?.question}</p>

        <div className="space-y-4">
          {currentQuestionData?.options.map((option, index) => (
            <QuestionOptions
              key={index}
              option={option}
              optionIndex={index}
              questionNumber={currentQuestion}
              selectedAnswer={selectedAnswers.get(currentQuestion)}
              handleOptionChange={(qNumber, aIndex) =>
                handleOptionChange(qNumber, aIndex, currentQuestionData?._id ?? "")
              }
            />
          ))}
        </div>
      </div>
    );
  }
);

QuestionPanel.displayName = "QuestionPanel";

export default QuestionPanel;
