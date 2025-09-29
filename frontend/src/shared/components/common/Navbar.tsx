"use client";

import { useEffect, useState, memo, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User, ChevronDown, Settings, LogOut, Home, BookOpen, Trophy, Target, Play } from "lucide-react";
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
  const logout = useAuthStore(state => state.logout);
  
  // UI state
  const { isNavbarOpen, toggleNavbar, setNavbarOpen } = useUIStore();
  
  // Local state with stable initial values
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Mobile-first responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
    };
    
    checkMobile();
    
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };
    
    window.addEventListener('resize', throttledResize);
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const newScrolled = window.scrollY > 10;
      setScrolled(prev => prev !== newScrolled ? newScrolled : prev);
    };
    
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 16);
    };
    
    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", throttledScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Close mobile menu and dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close mobile menu if clicking outside
      if (isNavbarOpen && !target.closest('nav')) {
        setNavbarOpen(false);
      }
      
      // Close user dropdown if clicking outside
      if (userDropdownOpen && !target.closest('[data-dropdown="user"]')) {
        setUserDropdownOpen(false);
      }
    };

    if (isNavbarOpen || userDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      
      // Only prevent scroll for mobile menu, not dropdown
      if (isNavbarOpen) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isNavbarOpen, userDropdownOpen, setNavbarOpen]);

  // Memoized navigation items to prevent recreation on every render
  const navItems = useMemo(() => [
    { name: "Home", href: "/", icon: Home },
    { name: "JEE Mains", href: "/exam/jee-mains", icon: BookOpen },
    { name: "JEE Advanced", href: "/exam/jee-advanced", icon: Trophy },
    { name: "CUET", href: "/exam/cuet", icon: Target },
    { name: "Practice", href: "/dashboard/practice", icon: Play },
  ], []);

  // Memoized computed values to prevent recalculation
  const { displayName, firstName, isSuperAdmin, isAdmin, hasAdminAccess } = useMemo(() => {
  const displayName = user?.fullName || 'Guest';
    const firstName = displayName.split(' ')[0];
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin';
  const hasAdminAccess = isAdmin || isSuperAdmin;
    
    return { displayName, firstName, isSuperAdmin, isAdmin, hasAdminAccess };
  }, [user?.fullName, userRole]);

  // Memoized logout handler to prevent recreation
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
      setNavbarOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, setNavbarOpen]);

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white border-b border-gray-100'
      } ${className}`}
    >
      {/* Main Navbar Container - Mobile First */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Logo - Responsive sizing */}
          <Link 
            href="/" 
            className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0 relative z-10"
            onClick={() => setNavbarOpen(false)}
          >
            <div className="relative">
              <Image
                src="/ionia_logo.png"
                alt="iONIA Logo"
                width={32}
                height={32}
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm"
                priority
              />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300 drop-shadow-sm">
              iONIA
            </span>
          </Link>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    isActive 
                      ? 'text-white bg-emerald-600 shadow-sm' 
                      : 'text-gray-700 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Admin Access */}
                {hasAdminAccess && (
                    <Link
                      href="/admin"
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden xl:inline">
                        {isSuperAdmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </Link>
                )}

                {/* User Dropdown */}
                <div className="relative" data-dropdown="user">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-emerald-700">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden lg:inline max-w-24 truncate">{firstName}</span>
                    <motion.div
                      animate={{ rotate: userDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {userDropdownOpen && (
                      <>
                        {/* Mobile/Small Screen: Full Screen Overlay */}
                        {isMobile ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="user-dropdown-mobile fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                            onClick={() => setUserDropdownOpen(false)}
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 20 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* User Info Header */}
                              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-semibold text-emerald-700">
                                      {firstName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{displayName}</p>
                                    <p className="text-sm text-gray-600">{user?.email}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Menu Items */}
                              <div className="py-2">
                                <Link
                                  href="/dashboard"
                                  className="flex items-center space-x-3 px-6 py-4 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                  onClick={() => setUserDropdownOpen(false)}
                  >
                    <User className="w-5 h-5" />
                                  <span className="font-medium">Dashboard</span>
                                </Link>
                                
                                {hasAdminAccess && (
                                  <Link
                                    href="/admin"
                                    className="flex items-center space-x-3 px-6 py-4 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                    onClick={() => setUserDropdownOpen(false)}
                                  >
                                    <Settings className="w-5 h-5" />
                                    <span className="font-medium">
                                      {isSuperAdmin ? 'Super Admin' : 'Admin Panel'}
                                    </span>
                                  </Link>
                                )}
                                
                                <hr className="my-2 border-gray-100" />
                                
                                <button
                                  onClick={handleLogout}
                                  className="flex items-center space-x-3 w-full px-6 py-4 text-red-600 hover:bg-red-50 transition-colors duration-200"
                                >
                                  <LogOut className="w-5 h-5" />
                                  <span className="font-medium">Sign Out</span>
                                </button>
                              </div>
                            </motion.div>
                          </motion.div>
                        ) : (
                          /* Desktop: Dropdown Menu */
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="user-dropdown-desktop absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[60] overflow-hidden"
                            style={{ 
                              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                            }}
                          >
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-gray-100">
                              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                            </div>

                            {/* Menu Items */}
                            <div className="py-1">
                              <Link
                                href="/dashboard"
                                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                onClick={() => setUserDropdownOpen(false)}
                              >
                                <User className="w-4 h-4" />
                                <span>Dashboard</span>
                              </Link>
                              
                              {hasAdminAccess && (
                                <Link
                                  href="/admin"
                                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                  onClick={() => setUserDropdownOpen(false)}
                                >
                                  <Settings className="w-4 h-4" />
                                  <span>{isSuperAdmin ? 'Super Admin' : 'Admin Panel'}</span>
                  </Link>
                              )}
                            </div>
                            
                            <hr className="my-1 border-gray-100" />
                            
                            <button
                              onClick={handleLogout}
                              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </motion.div>
                        )}
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200 shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleNavbar}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Toggle navigation menu"
          >
            <motion.div
              animate={{ rotate: isNavbarOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
          >
            {isNavbarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isNavbarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="backdrop-overlay fixed inset-0 bg-black/30 backdrop-blur-sm z-[55] md:hidden"
              onClick={() => setNavbarOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mobile-menu-panel absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-[60] md:hidden"
            >
              <div className="px-4 py-6 space-y-4">
                
                {/* Navigation Links */}
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setNavbarOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                          isActive 
                            ? 'text-white bg-emerald-600 shadow-sm' 
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                  >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        <span className="font-medium">{item.name}</span>
                        {isActive && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                        )}
                  </Link>
                    );
                  })}
                </div>

                {/* Divider */}
                <hr className="border-gray-200" />

                {/* Auth Section */}
                <div className="space-y-2">
                {isAuthenticated ? (
                  <>
                      {/* User Info */}
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-emerald-700">
                            {firstName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{displayName}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>

                      {/* Dashboard Link */}
                      <Link
                        href="/dashboard"
                        onClick={() => setNavbarOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      >
                        <User className="w-5 h-5" />
                        <span>Dashboard</span>
                      </Link>

                      {/* Admin Access */}
                      {hasAdminAccess && (
                    <Link
                          href="/admin"
                      onClick={() => setNavbarOpen(false)}
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    >
                          <Settings className="w-5 h-5" />
                          <span>{isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}</span>
                    </Link>
                      )}

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setNavbarOpen(false)}
                        className="flex items-center justify-center px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200 border border-gray-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setNavbarOpen(false)}
                        className="flex items-center justify-center px-4 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
});

export default Navbar;