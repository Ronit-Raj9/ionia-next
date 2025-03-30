// src/app/layout.tsx
import { Inter } from "next/font/google";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import Notifications from "@/components/common/Notifications";
import CookieConsent from "@/components/common/CookieConsent";
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
          <div className="flex flex-col min-h-screen">
            <Navbar className="fixed top-0 left-0 right-0 h-16 z-50" />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <Footer className="z-40 bg-green-900" />
            <Notifications />
            <CookieConsent />
          </div>
        </ReduxProvider>
      </body>
    </html>
  );
}