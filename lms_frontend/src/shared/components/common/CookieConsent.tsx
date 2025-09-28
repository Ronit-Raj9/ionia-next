"use client";

import React, { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cookie className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm text-gray-900">
                We use cookies to enhance your learning experience and analyze our traffic.
              </p>
              <p className="text-xs text-gray-600">
                By continuing to use our site, you consent to our use of cookies.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={declineCookies}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Decline
            </button>
            <button
              onClick={acceptCookies}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
            >
              Accept
            </button>
            <button
              onClick={declineCookies}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
