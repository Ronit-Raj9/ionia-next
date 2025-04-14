"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks/hooks';
import TestWindow from '@/components/test/TestWindow';
import { fetchTest } from '@/redux/slices/testSlice';
import { useParams } from 'next/navigation';

const TestWindowClientWrapper = () => {
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentTest, loading, error } = useAppSelector(state => state.test);
  const [clientError, setClientError] = useState<string | null>(null);
  
  // Use a ref to track if we've already fetched the test
  const testFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch if we haven't already fetched and we have a paperId
    if (!testFetchedRef.current && params.paperId) {
      const initializeTest = async () => {
        try {
          console.log("Initializing test - first fetch attempt");
          testFetchedRef.current = true; // Mark as fetched before the async call
          await dispatch(fetchTest(params.paperId as string));
        } catch (err) {
          console.error("Failed to initialize test:", err);
          setClientError("Failed to load test data");
        }
      };

      initializeTest();
    }
  }, [dispatch, params.paperId]); // Keep dependencies minimal

  // REMOVE ALL VALIDATION LOGIC
  // Just pass data directly to the TestWindow component

  if (loading && !currentTest) {
    return <div>Loading test...</div>;
  }

  if (error || clientError) {
    return <div>Error: {error || clientError}</div>;
  }

  if (!currentTest) {
    return <div>No test data available</div>;
  }

  // Pass data directly to TestWindow with no validation
  return (
    <TestWindow 
      examType={params.examType as string} 
      paperId={params.paperId as string}
      subject={currentTest.subject}
    />
  );
};

export default TestWindowClientWrapper; 