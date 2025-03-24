"use client";
import React from 'react';
import { NotVisitedIcon, NotAnsweredIcon, AnsweredIcon, MarkedForReviewIcon, AnsweredAndMarkedIcon } from '@/components/QuestionPaletteIcons';
import { TestQuestion } from "@/redux/slices/testSlice";

interface QuestionStatusProps {
  questions: TestQuestion[];
  total: number;
}

const QuestionStatus: React.FC<QuestionStatusProps> = ({ questions, total }) => {
  // Calculate counts for each state based on question properties.
  const counts = questions.reduce(
    (acc, question) => {
      const isAnswered = question.userAnswer !== undefined;
      const isMarked = question.isMarked;
      const isVisited = question.isVisited;

      if (isAnswered && isMarked) {
        acc.answeredAndMarked++;
      } else if (isMarked) {
        acc.markedForReview++;
      } else if (isAnswered) {
        acc.answered++;
      } else if (isVisited) {
        acc.notAnswered++;
      } else {
        acc.notVisited++;
      }
      return acc;
    },
    {
      notVisited: 0,
      notAnswered: 0,
      answered: 0,
      markedForReview: 0,
      answeredAndMarked: 0,
    }
  );

  return (
    <div className="bg-white p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Question Status</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <NotVisitedIcon className="w-6 h-6 mr-2" />
          <span className="text-sm">{counts.notVisited} Not Visited</span>
        </div>
        <div className="flex items-center">
          <NotAnsweredIcon className="w-6 h-6 mr-2" />
          <span className="text-sm">{counts.notAnswered} Not Answered</span>
        </div>
        <div className="flex items-center">
          <AnsweredIcon className="w-6 h-6 mr-2" />
          <span className="text-sm">{counts.answered} Answered</span>
        </div>
        <div className="flex items-center">
          <MarkedForReviewIcon className="w-6 h-6 mr-2" />
          <span className="text-sm">{counts.markedForReview} Marked for Review</span>
        </div>
        <div className="flex items-center">
          <AnsweredAndMarkedIcon className="w-6 h-6 mr-2" />
          <span className="text-sm">{counts.answeredAndMarked} Answered & Marked for Review</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionStatus;
