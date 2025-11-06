// src/app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import type { Viewport } from "next";
import Navbar from "@/shared/components/common/Navbar";
import Notifications from "@/shared/components/common/Notifications";
import CookieConsent from "@/shared/components/common/CookieConsent";
import ErrorBoundary from "@/components/ErrorBoundary";
import { RoleProvider } from "@/contexts/RoleContext";
import "@/styles/globals.css";
import { Toaster } from 'react-hot-toast';
import { enableMapSet } from 'immer';

enableMapSet();

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#10b981",
  viewportFit: "cover",
};

// Initialize systems on first load
if (typeof window !== 'undefined') {
  // Initialize cache system
  // initializeCacheSystem();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        
        {/* DNS Prefetch for performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Preconnect for critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical CSS inlined */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical above-the-fold styles */
            body { margin: 0; font-family: ${inter.style.fontFamily}; }
            .loading-spinner { 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              background: #f9fafb;
            }
            .loading-spinner::after {
              content: '';
              width: 40px;
              height: 40px;
              border: 4px solid #f3f4f6;
              border-top: 4px solid #10b981;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
        
        {/* Security headers via meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* LMS specific meta tags */}
        <meta name="application-name" content="LMS - Learning Management System" />
        <meta name="description" content="Intelligent Learning Management System with adaptive question chaining for enhanced learning experience" />
        <meta name="keywords" content="LMS, learning management, education, adaptive learning, question chaining" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        {/* Main application */}
        <RoleProvider>
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              
              <main className="flex-1 pt-16">
                {children}
              </main>
            </div>
            
            {/* Global components */}
            <Notifications />
            <CookieConsent />
            <Toaster position="bottom-right" />
          </ErrorBoundary>
        </RoleProvider>
        
        {/* Service Worker registration - disabled in development */}
        {process.env.NODE_ENV === 'production' && (
          <script dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      // Silently fail if SW file doesn't exist - not critical
                      if (registrationError.message && registrationError.message.includes('404')) {
                        console.debug('ServiceWorker not available (404) - continuing without SW');
                      } else {
                        console.log('SW registration failed: ', registrationError);
                      }
                    });
                });
              }
            `
          }} />
        )}
        
        {/* Google Analytics (if configured) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `
            }} />
          </>
        )}
        
        {/* Resource hints for next navigation */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Preload likely next pages based on current route
            const currentPath = window.location.pathname;
            const preloadRoutes = [];
            
            // Only prefetch actual page routes, not API endpoints
            if (currentPath === '/') {
              preloadRoutes.push('/login', '/student', '/teacher', '/admin', '/superadmin');
            } else if (currentPath.startsWith('/admin')) {
              // Admin routes exist
            } else if (currentPath.startsWith('/teacher')) {
              // Teacher routes exist
            } else if (currentPath.startsWith('/student')) {
              // Student routes exist
            }
            
            // Only prefetch routes that likely exist
            preloadRoutes.forEach(route => {
              try {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = route;
                document.head.appendChild(link);
              } catch (e) {
                // Silently fail prefetch errors
              }
            });
          `
        }} />
      </body>
    </html>
  );
}
