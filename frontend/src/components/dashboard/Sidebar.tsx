// frontend/components/dashboard/Sidebar.tsx
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiBarChart2, 
  FiFileText, 
  FiBook, 
  FiUser, 
  FiHelpCircle,
  FiAward,
  FiChevronRight,
  FiLogOut
} from 'react-icons/fi';
import { useAppDispatch } from '@/redux/hooks/hooks';
import { logout } from '@/redux/slices/authSlice';
import { clearAllCachedData } from '@/lib/api';

interface SidebarProps {
  username: string;
}

const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
};

const Sidebar: React.FC<SidebarProps> = ({ username }) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const navItems = [
    { icon: <FiHome size={20} />, label: 'Dashboard', href: '/dashboard', id: 'dashboard-link' },
    { icon: <FiBarChart2 size={20} />, label: 'Analytics', href: '/dashboard/analytics', id: 'analytics-link' },
    { icon: <FiFileText size={20} />, label: 'My Tests', href: '/dashboard/tests', id: 'tests-link' },
    { icon: <FiBook size={20} />, label: 'Study Material', href: '/dashboard/material', id: 'material-link' },
    { icon: <FiAward size={20} />, label: 'Practice', href: '/practice', id: 'practice-link' },
    { icon: <FiUser size={20} />, label: 'Profile', href: '/dashboard/profile', id: 'profile-link' },
    { icon: <FiHelpCircle size={20} />, label: 'Help', href: '/dashboard/help', id: 'help-link' },
  ];

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Navigating to: ${href}`);
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      // Clear all cached data first
      clearAllCachedData();
      
      // Dispatch the logout action
      await dispatch(logout()).unwrap();
      
      console.log('Logout successful, redirecting to login page');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, we should still redirect to login
      router.push('/auth/login');
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-white"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      {/* User info section */}
      <motion.div 
        className="p-6 border-b border-gray-100"
        variants={itemVariants}
      >
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-800">{username}</h2>
            <p className="text-sm text-gray-500 flex items-center">
              Student
              <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full ml-2"></span>
            </p>
          </div>
        </div>
      </motion.div>
      
      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto py-6">
        <motion.ul 
          className="space-y-1.5 px-3"
          variants={sidebarVariants}
        >
          {navItems.map((item) => (
            <motion.li 
              key={item.href}
              variants={itemVariants}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <a 
                href={item.href}
                id={item.id}
                className={`
                  group flex items-center px-4 py-3 text-gray-700 rounded-xl
                  transition-all duration-200 relative
                  hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-50
                  ${pathname === item.href 
                    ? 'bg-gradient-to-r from-emerald-50 to-emerald-50 text-emerald-600 font-medium shadow-sm' 
                    : 'hover:text-emerald-600'
                  }
                `}
                onClick={(e) => handleNavigation(e, item.href)}
              >
                <span className={`
                  mr-3 transition-colors duration-200
                  ${pathname === item.href ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-600'}
                `}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                <FiChevronRight 
                  className={`
                    w-5 h-5 transform transition-all duration-200
                    ${pathname === item.href 
                      ? 'opacity-100 translate-x-0 text-emerald-600' 
                      : 'opacity-0 -translate-x-4 text-gray-400 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-emerald-600'
                    }
                  `}
                />
              </a>
            </motion.li>
          ))}
        </motion.ul>
      </nav>
      
      {/* Logout button */}
      <motion.div 
        className="p-6 border-t border-gray-100"
        variants={itemVariants}
      >
        <motion.button 
          className="w-full flex items-center px-4 py-3 text-gray-700 rounded-xl
            transition-all duration-200 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-50
            hover:text-emerald-600 group"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
        >
          <span className="mr-3 text-gray-400 group-hover:text-emerald-600">
            <FiLogOut size={20} />
          </span>
          <span className="flex-1">Logout</span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;
