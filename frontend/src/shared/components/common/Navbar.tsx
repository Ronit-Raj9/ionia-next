"use client";

import { useEffect, useState, memo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUIStore } from "@/stores/uiStore";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  className?: string;
}

const Navbar = memo(function Navbar({ className = "" }: NavbarProps) {
  const pathname = usePathname();
  // Use optimized selectors to prevent unnecessary rerenders
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const userRole = useAuthStore(state => state.user?.role);
  const { isNavbarOpen, toggleNavbar, setNavbarOpen } = useUIStore();
  const [scrolled, setScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isNavbarOpen && isMounted) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNavbarOpen, isMounted]);

  // Debug logging removed to prevent console spam

  useEffect(() => {
    const handleScroll = () => {
      const newScrolled = window.scrollY > 10;
      // Only update state if the value actually changed
      setScrolled(prev => prev !== newScrolled ? newScrolled : prev);
    };
    
    // Throttle scroll events to prevent excessive calls
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 16); // ~60fps
    };
    
    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", throttledScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "JEE Mains", href: "/exam/jee-mains" },
    { name: "JEE Advanced", href: "/exam/jee-advanced" },
    { name: "CUET", href: "/exam/cuet" },
    { name: "Practice", href: "/dashboard/practice" },
  ];

  const displayName = user?.fullName || 'Guest';
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin';
  const hasAdminAccess = isAdmin || isSuperAdmin;

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return null;
  }

  // Mobile Sidebar Content (to be rendered via portal)
  const mobileSidebar = isMounted && isNavbarOpen ? (
    <AnimatePresence>
      {isNavbarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-[9998] md:hidden"
            onClick={() => setNavbarOpen(false)}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[9999] md:hidden overflow-y-auto"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <Link 
                href="/" 
                className="flex items-center space-x-3"
                onClick={() => setNavbarOpen(false)}
              >
                <Image
                  src="/ionia_logo.png"
                  alt="iONIA Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="text-2xl font-extrabold text-black">
                  iONIA
                </span>
              </Link>
              <button
                onClick={() => setNavbarOpen(false)}
                className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* User Info Section */}
            {isAuthenticated && (
              <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-black">{displayName}</p>
                    <p className="text-sm text-gray-600">
                      {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Student'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <div className="py-4">
              <div className="px-4 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Navigation
                </p>
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-6 py-3 text-base font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? "bg-emerald-50 text-emerald-600 border-r-4 border-emerald-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-black"
                  }`}
                  onClick={() => setNavbarOpen(false)}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Admin & User Actions */}
            <div className="py-4 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  {hasAdminAccess && (
                    <Link
                      href="/admin"
                      className="flex items-center space-x-3 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200"
                      onClick={() => setNavbarOpen(false)}
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
                      <span>{isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}</span>
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-black transition-all duration-200"
                    onClick={() => setNavbarOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                </>
              ) : (
                <div className="px-6 space-y-3">
                  <Link
                    href="/login"
                    className="block w-full text-center px-4 py-3 text-base font-semibold text-black bg-gray-100 rounded-lg border border-gray-300 hover:bg-gray-200 transition-all duration-200"
                    onClick={() => setNavbarOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block w-full text-center px-4 py-3 text-base font-semibold text-white bg-emerald-400 rounded-lg border border-emerald-400 hover:bg-emerald-500 transition-all duration-200"
                    onClick={() => setNavbarOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  ) : null;

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 bg-white border-b border-gray-200 ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Image
              src="/ionia_logo.png"
              alt="iONIA Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <span className="text-2xl font-extrabold text-black group-hover:text-gray-800 transition-colors duration-300">
              iONIA
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
                    <Link href="/dashboard/profile" className="block px-4 py-2 text-gray-700 hover:bg-emerald-50">Profile</Link>
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
                  className="px-4 py-2 text-sm font-semibold text-black bg-emerald-400 rounded-lg shadow-lg hover:bg-emerald-500 hover:scale-105 transition-all duration-200 border border-emerald-400"
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

      {/* Subtle border at the bottom */}
      <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200" />

      {/* Render Mobile Sidebar via Portal */}
      {isMounted && typeof document !== 'undefined' && mobileSidebar && createPortal(mobileSidebar, document.body)}
    </nav>
  );
});

export default Navbar;