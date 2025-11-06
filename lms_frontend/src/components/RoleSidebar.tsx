"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  LogOut,
  Search,
  Home,
  User,
  Bell,
  Settings as SettingsIcon,
} from 'lucide-react';
import Image from 'next/image';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: number | string;
  children?: SidebarItem[];
}

export interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface RoleSidebarProps {
  sections: SidebarSection[];
  activeItemId: string;
  onItemClick: (itemId: string) => void;
  userRole: string;
  userName: string;
  userEmail?: string;
  onLogout: () => void;
  enableSearch?: boolean;
  enableKeyboardNav?: boolean;
}

// Tooltip Component using Portal
interface TooltipProps {
  content: React.ReactNode;
  targetRef: React.RefObject<HTMLElement>;
  show: boolean;
}

function Tooltip({ content, targetRef, show }: TooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (show && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8, // 8px gap from icon
      });
    }
  }, [show, targetRef]);

  if (!show || typeof window === 'undefined') return null;

  return createPortal(
    <div
      className="fixed px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl pointer-events-none transition-opacity duration-200 whitespace-nowrap"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateY(-50%)',
        zIndex: 99999,
      }}
    >
      {content}
      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
    </div>,
    document.body
  );
}

export default function RoleSidebar({
  sections,
  activeItemId,
  onItemClick,
  userRole,
  userName,
  userEmail,
  onLogout,
  enableSearch = true,
  enableKeyboardNav = true,
}: RoleSidebarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed (icons only)
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredButtonRef, setHoveredButtonRef] = useState<React.RefObject<HTMLButtonElement> | null>(null);
  const [showProfileTooltip, setShowProfileTooltip] = useState(false);
  const [showLogoutTooltip, setShowLogoutTooltip] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const logoutRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNav) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsExpanded((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enableKeyboardNav]);

  const toggleGroup = (itemId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.children) {
      toggleGroup(item.id);
    } else {
      onItemClick(item.id);
      if (window.innerWidth < 1024) {
        setIsMobileOpen(false);
      }
    }
  };

  // Filter items based on search
  const filterItems = (items: SidebarItem[]): SidebarItem[] => {
    if (!searchQuery) return items;
    
    return items.filter((item) => {
      const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase());
      const childrenMatch = item.children?.some((child) =>
        child.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesSearch || childrenMatch;
    });
  };

  const renderItem = (item: SidebarItem, level: number = 0) => {
    const isActive = activeItemId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isGroupExpanded = expandedGroups.has(item.id);
    const isHovered = hoveredItem === item.id;
    const buttonRef = useRef<HTMLButtonElement>(null);

    const tooltipContent = (
      <>
        {item.label}
        {item.badge && (
          <span className="ml-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </>
    );

    return (
      <div key={item.id}>
        <motion.button
          ref={buttonRef}
          whileHover={{ x: 2 }}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => {
            setHoveredItem(item.id);
            setHoveredButtonRef(buttonRef);
          }}
          onMouseLeave={() => {
            setHoveredItem(null);
            setHoveredButtonRef(null);
          }}
          className={`
            w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
            ${level > 0 ? 'ml-4' : ''}
            ${isActive
              ? 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
              : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
            }
          `}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
              {item.icon}
            </div>
            
            {(isExpanded || isMobileOpen) && (
              <span className="font-medium text-sm truncate">{item.label}</span>
            )}
            
            {item.badge && (isExpanded || isMobileOpen) && (
              <span className="ml-auto flex-shrink-0 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </div>

          {hasChildren && (isExpanded || isMobileOpen) && (
            <div className="flex-shrink-0 ml-2">
              {isGroupExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
        </motion.button>

        {/* Tooltip using Portal - renders at document.body level */}
        {!isExpanded && !isMobileOpen && isHovered && hoveredButtonRef && (
          <Tooltip
            content={tooltipContent}
            targetRef={hoveredButtonRef as React.RefObject<HTMLElement>}
            show={isHovered}
          />
        )}

        {/* Render children if group is expanded */}
        <AnimatePresence>
          {hasChildren && isGroupExpanded && (isExpanded || isMobileOpen) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children?.map((child) => renderItem(child, level + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header with Toggle Only */}
      <div className="p-4 border-b border-gray-200">
        {(isExpanded || isMobileOpen) ? (
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsExpanded(false);
                } else {
                  setIsMobileOpen(false);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Expand sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      {enableSearch && (isExpanded || isMobileOpen) && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (isExpanded || isMobileOpen) && (
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {filterItems(section.items).map((item) => renderItem(item))}
            </div>
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <motion.button
          ref={logoutRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          onMouseEnter={() => setShowLogoutTooltip(true)}
          onMouseLeave={() => setShowLogoutTooltip(false)}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {(isExpanded || isMobileOpen) && (
            <span className="font-medium">Logout</span>
          )}
        </motion.button>
        
        {/* Tooltip using Portal */}
        {!isExpanded && !isMobileOpen && showLogoutTooltip && (
          <Tooltip
            content="Logout"
            targetRef={logoutRef as React.RefObject<HTMLElement>}
            show={showLogoutTooltip}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button - Fixed below navbar */}
      <div className="lg:hidden fixed top-20 left-4 z-[150]">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isExpanded ? 280 : 80,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block fixed left-0 top-16 h-[calc(100vh-4rem)] z-[100]"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[150]"
            />
            
            {/* Drawer */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="lg:hidden fixed left-0 top-16 h-[calc(100vh-4rem)] w-80 z-[160]"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </>
  );
}

