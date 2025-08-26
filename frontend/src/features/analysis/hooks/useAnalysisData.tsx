// analysis/hooks/useAnalysisData.ts
"use client";
import { useEffect, useState } from 'react';
import { useAnalysisStore } from '../store/analysisStore';
import { getTestAnalysis, transformAnalysisData } from '../api/analysisApi';
import { AnalysisData } from '../store/analysisStore';

interface UseAnalysisDataProps {
  attemptId?: string;
  paperId?: string;
  testId?: string;
}

export const useAnalysisData = ({ attemptId, paperId, testId }: UseAnalysisDataProps) => {
  const {
    currentAnalysis,
    isLoading,
    error,
    setAnalysisData,
    setLoading,
    setError,
    clearError
  } = useAnalysisStore();

  const [isInitialized, setIsInitialized] = useState(false);

  const fetchAnalysisData = async () => {
    if (!attemptId && !paperId && !testId) {
      setError('No attempt ID, paper ID, or test ID provided');
      return;
    }

    try {
      setLoading(true);
      clearError();

      let analysisData: AnalysisData;

      if (attemptId || paperId) {
        // Fetch from test analysis API
        const rawData = await getTestAnalysis(attemptId || '', paperId);
        analysisData = transformAnalysisData(rawData);
      } else if (testId) {
        // Fetch from analysis data API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/test/${testId}`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch analysis data');
        }
        
        const data = await response.json();
        analysisData = data.data;
      } else {
        throw new Error('Invalid parameters provided');
      }

      setAnalysisData(analysisData);
      setIsInitialized(true);
    } catch (err) {
      console.error('Error fetching analysis data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analysis data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attemptId || paperId || testId) {
      fetchAnalysisData();
    }
  }, [attemptId, paperId, testId]);

  const refetch = () => {
    fetchAnalysisData();
  };

  return {
    analysisData: currentAnalysis,
    isLoading,
    error,
    isInitialized,
    refetch,
    fetchAnalysisData
  };
};
