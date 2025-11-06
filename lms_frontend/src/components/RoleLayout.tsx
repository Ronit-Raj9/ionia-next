"use client";

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleLayoutProps {
  sidebarExpanded: boolean;
  children: ReactNode;
  activeSection: string;
}

export default function RoleLayout({
  sidebarExpanded,
  children,
  activeSection,
}: RoleLayoutProps) {
  return (
    <div
      className={`
        min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 transition-all duration-300
        ${sidebarExpanded ? 'lg:pl-[280px]' : 'lg:pl-[80px]'}
      `}
    >
      <div className="pt-20 lg:pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
            className="p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

