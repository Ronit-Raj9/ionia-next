// src/app/layout.tsx
// "use client";
import { Inter } from "next/font/google";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { Analytics } from "@vercel/analytics/react"

import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Test Series Platform",
  description: "Prepare for JEE Mains, Advanced, and CUET",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AnalysisProvider>
            <div className="min-h-screen flex flex-col bg-gray-100">
              <Navbar />
              <main className="flex-grow bg-white py-12 px-6 sm:px-8 md:px-16 lg:px-24 transition-all duration-300">
                <div className="max-w-7xl mx-auto">{children}</div>
              </main>
              <Footer />
            </div>
          </AnalysisProvider>
          <Analytics/>
        </AuthProvider>

      </body>
    </html>
  );
}

