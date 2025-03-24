"use client";
import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks/hooks';
import { setPaperId } from '@/redux/slices/testSlice';
import { AnalysisWindow } from '@/components/analysis';
import Navbar from '@/components/common/Navbar';
import { ClipLoader } from 'react-spinners';

const ResultsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const paperId = searchParams.get('paperId');
  const { loading } = useAppSelector((state) => state.analysis);

  useEffect(() => {
    if (paperId) {
      dispatch(setPaperId(paperId));
    }
  }, [dispatch, paperId]);

  if (!paperId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 max-w-3xl mx-auto">
            <p>No paper ID provided. Please go back and select a test.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ClipLoader size={50} color="#3b82f6" />
            </div>
          ) : (
            <AnalysisWindow paperId={paperId} examType="test" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage; 