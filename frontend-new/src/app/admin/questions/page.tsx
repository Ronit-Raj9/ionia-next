"use client";

import { useState, useEffect } from 'react';
import { useQuestionStore, useQuestionForm, useQuestionActions } from '@/stores/questionStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const { tempQuestionData } = useQuestionForm();

  useEffect(() => {
    // Fetch questions logic here
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Questions</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Questions management interface will be implemented here.</p>
      </div>
    </div>
  );
}
