"use client";

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

interface FooterProps {
  className?: string;
}

export default function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-600 text-white relative overflow-hidden ${className}`}>
      {/* Updated grid pattern to match hero section */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>
      
      {/* Updated overlay gradient to match hero section */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-800/50 via-transparent to-teal-800/50"></div>
      
      {/* Add floating animated elements like hero section */}
      <motion.div 
        className="absolute top-20 left-10 w-20 h-20 bg-emerald-400/20 rounded-full blur-xl"
        animate={{ 
          y: [-20, 20, -20],
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute top-40 right-20 w-32 h-32 bg-teal-400/20 rounded-full blur-xl"
        animate={{ 
          y: [20, -20, 20],
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-20 left-1/4 w-24 h-24 bg-emerald-300/20 rounded-full blur-xl"
        animate={{ 
          x: [-30, 30, -30],
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div 
            className="space-y-3 lg:space-y-4"
            {...fadeInUp}
          >
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                IONIA
              </h3>
              <p className="text-emerald-100 leading-relaxed text-sm sm:text-base max-w-lg">
                We provide the perfect tools to personalise your own journey to achieve whatever you want.
              </p>
            </div>
            <div className="flex space-x-3">
              <a href="#" className="group transform hover:scale-110 transition-all duration-300 p-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                <Facebook className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200" />
              </a>
              <a href="#" className="group transform hover:scale-110 transition-all duration-300 p-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                <Twitter className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200" />
              </a>
              <a href="#" className="group transform hover:scale-110 transition-all duration-300 p-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                <Instagram className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200" />
              </a>
            </div>
          </motion.div>

          <motion.div className="lg:pl-4" {...fadeInUp}>
            <div className="space-y-4">
              <h4 className="text-lg sm:text-xl font-semibold relative inline-block">
                Contact Us
                <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-200 rounded-full"></span>
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-2 text-emerald-200 hover:text-white transition-colors duration-300 group">
                  <div className="p-1.5 rounded-full bg-emerald-400/20 group-hover:bg-emerald-400/30 transition-colors duration-300">
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm">ionia.ebh@gmail.com</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-200 hover:text-white transition-colors duration-300 group">
                  <div className="p-1.5 rounded-full bg-emerald-400/20 group-hover:bg-emerald-400/30 transition-colors duration-300">
                    <Phone className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm">+91 123 456 7890</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-200 hover:text-white transition-colors duration-300 group">
                  <div className="p-1.5 rounded-full bg-emerald-400/20 group-hover:bg-emerald-400/30 transition-colors duration-300">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm">India</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="border-t border-emerald-700/50 mt-8 sm:mt-10 lg:mt-12 pt-4 sm:pt-5 text-center"
          {...fadeInUp}
        >
          <p className="text-emerald-200 text-xs sm:text-sm">
            © {new Date().getFullYear()} TestSeries. All rights reserved.
            <span className="mx-1.5">|</span>
            <Link href="/privacy" className="hover:text-white transition-colors duration-300 hover:underline">
              Privacy Policy
            </Link>
            <span className="mx-1.5">|</span>
            <Link href="/terms" className="hover:text-white transition-colors duration-300 hover:underline">
              Terms of Service
            </Link>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}