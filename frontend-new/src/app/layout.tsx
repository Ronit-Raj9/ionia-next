// src/app/layout.tsx
import { Inter } from "next/font/google";
import type { Viewport } from "next";
import Navbar from "@/shared/components/common/Navbar";
import Footer from "@/shared/components/common/Footer";
import Notifications from "@/shared/components/common/Notifications";
import CookieConsent from "@/shared/components/common/CookieConsent";
import AuthProvider from "@/providers/AuthProvider";
// import PerformanceInitializer from "@/components/performance/PerformanceInitializer";
import { initializeCacheSystem } from "@/stores/cacheStore";
// import { preloadComponentsByRole } from "@/components/performance/LazyComponents";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Test Series Platform - Prepare for JEE Mains, Advanced, and CUET",
  description: "Comprehensive test preparation platform with advanced analytics and role-based access control",
  keywords: "JEE Mains, JEE Advanced, CUET, test preparation, online tests, analytics",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" }
    ]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#10B981",
};

// Initialize systems on first load
if (typeof window !== 'undefined') {
  // Initialize cache system
  initializeCacheSystem();
  
  // Preload components based on initial route
  // const pathname = window.location.pathname;
  // if (pathname.startsWith('/admin')) {
  //   preloadComponentsByRole('admin');
  // } else {
  //   preloadComponentsByRole('user');
  // }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
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
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Performance hints */}
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        {/* Performance monitoring initialization */}
        {/* <PerformanceInitializer /> */}
        
        {/* Main application */}
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            
            <main className="flex-1">
              {children}
            </main>
            
            <Footer />
          </div>
          
          {/* Global components */}
          <Notifications />
          <CookieConsent />
        </AuthProvider>
        
        {/* Service Worker registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `
        }} />
        
        {/* Performance observer script */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Measure Core Web Vitals
            function vitals(metric) {
              console.log('Core Web Vitals:', metric);
              
              // Send to analytics (replace with your analytics service)
              if (typeof gtag !== 'undefined') {
                gtag('event', metric.name, {
                  custom_parameter_value: Math.round(metric.value),
                  custom_parameter_id: metric.id,
                  custom_parameter_delta: metric.delta
                });
              }
            }
            
            // Load web-vitals library dynamically
            import('https://unpkg.com/web-vitals@3/dist/web-vitals.attribution.js')
              .then(({ onCLS, onFCP, onFID, onLCP, onTTFB, onINP }) => {
                onCLS(vitals);
                onFCP(vitals);
                onFID(vitals);
                onLCP(vitals);
                onTTFB(vitals);
                onINP(vitals);
              })
              .catch(err => console.log('Web Vitals failed to load:', err));
          `
        }} />
        
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
            
            if (currentPath === '/') {
              preloadRoutes.push('/dashboard', '/auth/login');
            } else if (currentPath === '/dashboard') {
              preloadRoutes.push('/exam', '/practice', '/profile');
            } else if (currentPath.startsWith('/admin')) {
              preloadRoutes.push('/admin/users', '/admin/tests', '/admin/questions');
            }
            
            preloadRoutes.forEach(route => {
              const link = document.createElement('link');
              link.rel = 'prefetch';
              link.href = route;
              document.head.appendChild(link);
            });
          `
        }} />
      </body>
    </html>
  );
}