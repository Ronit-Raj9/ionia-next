"use client";

import React from 'react';
import { QuestionEditPage } from '@/features/admin/components/questions/edit';

interface EditQuestionPageProps {
  params: {
    questionId: string;
  };
}

export default function EditQuestionPage({ params }: EditQuestionPageProps) {
  return <QuestionEditPage questionId={params.questionId} />;
}
