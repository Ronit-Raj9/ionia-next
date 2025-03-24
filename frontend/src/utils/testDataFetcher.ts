"use client";

export async function fetchTestDataManually(paperId: string) {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.error('API URL is not configured');
    return null;
  }
  
  try {
    console.log(`Manual test fetch from: ${process.env.NEXT_PUBLIC_API_URL}/previous-year-papers/get/${paperId}`);
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/previous-year-papers/get/${paperId}`,
      {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    console.log('Manual fetch response status:', response.status);
    
    if (!response.ok) {
      console.error('Manual fetch error status:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('Manual fetch raw response:', data);
    
    return data;
  } catch (error) {
    console.error('Manual fetch error:', error);
    return null;
  }
} 