"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks/hooks";
import { getCurrentUser } from "@/redux/slices/authSlice";
import { toggleNavbar, setNavbarOpen } from "@/redux/slices/uiSlice";
import { RootState } from "@/redux/store";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = "" }: NavbarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state: RootState) => state.auth);
  const { isNavbarOpen } = useAppSelector((state: RootState) => state.ui);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "JEE Mains", href: "/exam/jee-mains" },
    { name: "JEE Advanced", href: "/exam/jee-advanced" },
    { name: "CUET", href: "/exam/cuet" },
    { name: "Practice", href: "/practice" },
  ];

  const displayName = user?.fullName || 'Guest';

  // Separate checks for admin and superadmin
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';
  const hasAdminAccess = isAdmin || isSuperAdmin;

  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav className={`fixed w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              Ionia
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                  pathname === item.href ? "text-emerald-600" : "text-gray-600"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {hasAdminAccess && (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/admin"
                      className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors"
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
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{displayName}</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-gray-100 transition-colors"
            onClick={() => dispatch(toggleNavbar())}
          >
            {isNavbarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isNavbarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-emerald-600 ${
                      pathname === item.href ? "text-emerald-600" : "text-gray-600"
                    }`}
                    onClick={() => dispatch(setNavbarOpen(false))}
                  >
                    {item.name}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <>
                    {hasAdminAccess && (
                      <Link
                        href="/admin"
                        className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
                        onClick={() => dispatch(setNavbarOpen(false))}
                      >
                        {isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
                      onClick={() => dispatch(setNavbarOpen(false))}
                    >
                      {displayName}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
                      onClick={() => dispatch(setNavbarOpen(false))}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                      onClick={() => dispatch(setNavbarOpen(false))}
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
    </nav>
  );
}