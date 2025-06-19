'use client';

import { useEffect } from 'react';

export default function TestTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use effect to hide the header and footer
  useEffect(() => {
    // Find and hide the header/navbar
    const header = document.querySelector('header');
    const navbar = document.querySelector('nav');
    const footer = document.querySelector('footer');
    
    if (header) header.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    
    // Add a class to the body to apply full-screen styles
    document.body.classList.add('test-mode');
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    
    // Cleanup function to restore elements when leaving the test
    return () => {
      if (header) header.style.display = '';
      if (navbar) navbar.style.display = '';
      if (footer) footer.style.display = '';
      document.body.classList.remove('test-mode');
      document.body.style.overflow = '';
    };
  }, []);

  return <>{children}</>;
} 