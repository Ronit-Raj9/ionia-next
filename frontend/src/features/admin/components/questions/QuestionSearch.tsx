"use client";

import React from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useQuestionStore } from '../../store/questionStore';

export const QuestionSearch: React.FC = () => {
  const { searchQuery, setSearchQuery } = useQuestionStore();

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search questions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
      />
      <MagnifyingGlassIcon className="h-5 w-5 text-green-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
    </div>
  );
};