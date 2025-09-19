"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { AddQuestionLayout } from '@/features/admin/components/questions';

export default function AddQuestionPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/admin/questions');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AddQuestionLayout 
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}