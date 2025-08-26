"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUIStore } from "@/stores/uiStore";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = "" }: NavbarProps) {
  const pathname = usePathname();
  // Use selectors to avoid unnecessary rerenders
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const { isNavbarOpen, toggleNavbar, setNavbarOpen } = useUIStore();
  const [scrolled, setScrolled] = useState(false);

  console.log("isAuthenticated: ",isAuthenticated);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "JEE Mains", href: "/exam/jee-mains" },
    { name: "JEE Advanced", href: "/exam/jee-advanced" },
    { name: "CUET", href: "/exam/cuet" },
    { name: "Practice", href: "/practice" },
  ];

  const displayName = user?.fullName || 'Guest';
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const hasAdminAccess = isAdmin || isSuperAdmin;

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 bg-white border-b border-gray-200 ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-extrabold text-black group-hover:text-gray-800 transition-colors duration-300">
              Ionia
            </span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-10 bg-gray-100 rounded-xl px-8 py-2 shadow-sm">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative text-sm font-semibold transition-all duration-200 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400/60 ${pathname === item.href ? "text-black" : "text-gray-700 hover:text-black"}`}
              >
                <span className="relative z-10">{item.name}</span>
                <span
                  className={`absolute left-0 -bottom-1 w-full h-0.5 rounded bg-emerald-400 transition-all duration-300 ${pathname === item.href ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:scale-x-100 group-hover:opacity-60"}`}
                />
              </Link>
            ))}
          </div>

          {/* Auth/User Buttons */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            {isAuthenticated ? (
              <>
                {hasAdminAccess && (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/admin"
                      className="flex items-center space-x-2 text-black hover:text-gray-800 transition-colors px-3 py-1 rounded-lg bg-gray-100 shadow-sm border border-gray-300 hover:scale-105 duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {isSuperAdmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </Link>
                  </div>
                )}
                <div className="relative group">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 text-black hover:text-gray-800 transition-colors px-3 py-1 rounded-lg bg-gray-100 shadow-sm border border-gray-300 hover:scale-105 duration-200"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{displayName}</span>
                  </Link>
                  {/* Example dropdown (expand for real use) */}
                  {/* <div className="absolute right-0 mt-2 w-40 bg-white/90 rounded-lg shadow-lg py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200">
                    <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-emerald-50">Profile</Link>
                    <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-emerald-50">Logout</button>
                  </div> */}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-black hover:text-gray-800 transition-colors px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 duration-200 shadow"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-400 rounded-lg shadow-lg hover:bg-emerald-500 hover:scale-105 transition-all duration-200 border border-emerald-400 animate-bounce hover:animate-none"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-black hover:text-gray-800 hover:bg-gray-100 transition-colors shadow border border-gray-300"
            onClick={() => toggleNavbar()}
          >
            {isNavbarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isNavbarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed inset-0 z-40 bg-white/95 backdrop-blur-lg md:hidden"
          >
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col space-y-6 items-center justify-center min-h-[60vh]">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-lg font-bold transition-all duration-200 px-4 py-2 rounded-xl shadow bg-gray-100 hover:bg-gray-200 text-black hover:text-gray-800 border border-gray-300 ${pathname === item.href ? "bg-emerald-100 text-black" : ""}`}
                    onClick={() => setNavbarOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    {hasAdminAccess && (
                      <Link
                        href="/admin"
                        className="text-lg font-bold px-4 py-2 rounded-xl shadow bg-gray-100 hover:bg-gray-200 text-black hover:text-gray-800 border border-gray-300"
                        onClick={() => setNavbarOpen(false)}
                      >
                        {isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="text-lg font-bold px-4 py-2 rounded-xl shadow bg-gray-100 hover:bg-gray-200 text-black hover:text-gray-800 border border-gray-300"
                      onClick={() => setNavbarOpen(false)}
                    >
                      {displayName}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-lg font-bold px-4 py-2 rounded-xl shadow bg-gray-100 hover:bg-gray-200 text-black hover:text-gray-800 border border-gray-300"
                      onClick={() => setNavbarOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="text-lg font-bold px-4 py-2 rounded-xl shadow bg-emerald-400 text-white border border-emerald-400 hover:bg-emerald-500 hover:scale-105 transition-all duration-200 animate-bounce hover:animate-none"
                      onClick={() => setNavbarOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Subtle border at the bottom */}
      <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200" />
    </nav>
  );
}