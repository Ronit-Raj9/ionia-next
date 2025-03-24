// src/app/layout.tsx
import { Inter } from "next/font/google";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import Notifications from "@/components/common/Notifications";
import { ReduxProvider } from "@/redux/provider";
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
        <ReduxProvider>
          <div className="min-h-screen flex flex-col bg-gray-100">
            <Navbar />
            <main className="flex-grow bg-white py-12 px-6 sm:px-8 md:px-16 lg:px-24 transition-all duration-300">
              <div className="max-w-7xl mx-auto">{children}</div>
            </main>
            <Footer />
            <Notifications />
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}