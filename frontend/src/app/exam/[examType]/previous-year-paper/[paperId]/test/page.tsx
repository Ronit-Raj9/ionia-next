"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import TestWindow from "@/components/test/TestWindow";
import './styles.css';

export default function TestPage() {
  const params = useParams();
  const [isClient, setIsClient] = useState(false);
  
  // Ensure we're running on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
    
    // Hide any parent headers or footers
    const hideElements = () => {
      const elements = document.querySelectorAll('header, footer, nav');
      elements.forEach(el => {
        if (el.parentElement?.id !== 'test-window-container') {
          (el as HTMLElement).style.display = 'none';
        }
      });
      
      // Set body styles for the test page
      document.body.style.overflow = 'hidden';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
    };
    
    if (isClient) {
      hideElements();
      // Set timeout to ensure elements are hidden after React hydration
      setTimeout(hideElements, 100);
    }
    
    return () => {
      // Restore elements when navigating away
      const elements = document.querySelectorAll('header, footer, nav');
      elements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
      document.body.style.overflow = '';
    };
  }, [isClient]);
  
  // Convert params to strings (take the first element if they are arrays)
  const examType = Array.isArray(params.examType) ? params.examType[0] : params.examType || "";
  const paperId = Array.isArray(params.paperId) ? params.paperId[0] : params.paperId || "";
  
  // Log params for debugging
  useEffect(() => {
    if (isClient && examType && paperId) {
      console.log(`Test page params: examType=${examType}, paperId=${paperId}`);
    }
  }, [isClient, examType, paperId]);
  
  // If not client-side yet, return minimal content to prevent hydration issues
  if (!isClient) {
    return <div className="min-h-screen bg-white"></div>;
  }
  
  return (
    <div id="test-window-container" className="min-h-screen bg-white">
      <TestWindow 
        examType={examType} 
        paperId={paperId} 
      />
    </div>
  );
}
