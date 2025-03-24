"use client";

export function checkEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_API_URL) {
    errors.push('NEXT_PUBLIC_API_URL is not defined');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
} 