"use client";
import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAcceptAll = () => {
    // Set cookie consent in localStorage
    localStorage.setItem('cookieConsent', 'all');
    
    // Set a test cookie to ensure cookies are enabled
    document.cookie = "cookiesEnabled=true; path=/; SameSite=None; Secure";
    
    // For mobile browsers, set a specific flag
    document.cookie = "mobileConsent=true; path=/; SameSite=None; Secure; max-age=31536000";
    
    setShowConsent(false);
  };

  const handleAcceptNecessary = () => {
    // Set cookie consent in localStorage
    localStorage.setItem('cookieConsent', 'necessary');
    
    // Set a test cookie to ensure cookies are enabled
    document.cookie = "cookiesEnabled=true; path=/; SameSite=None; Secure";
    
    // For mobile browsers, set a specific flag for necessary cookies
    document.cookie = "mobileConsent=necessary; path=/; SameSite=None; Secure; max-age=31536000";
    
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex items-center justify-between">
          <div className="mb-4 md:mb-0 md:mr-4">
            <h3 className="text-lg font-semibold mb-2">Cookie Settings</h3>
            <p className="text-gray-600 text-sm">
              We use cookies for authentication and to enhance your browsing experience. 
              Please accept cookies to enable login and registration functionality.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAcceptNecessary}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Accept Necessary
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 