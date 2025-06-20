"use client";

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, MapPin } from 'lucide-react';
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
    <footer className={`bg-white border-t border-gray-200 text-gray-800 ${className}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div className="space-y-4" {...fadeInUp}>
            <h3 className="text-2xl font-bold text-emerald-600">TestSeries</h3>
            <p className="text-gray-600 leading-relaxed">
              Your ultimate preparation platform for competitive exams. Empowering students to achieve their dreams through quality education.
            </p>
            <div className="flex space-x-4 pt-4">
              <a href="#" className="hover:text-emerald-500 transition-colors duration-200">
                <Facebook className="w-5 h-5 text-emerald-400 hover:text-emerald-600" />
              </a>
              <a href="#" className="hover:text-emerald-500 transition-colors duration-200">
                <Twitter className="w-5 h-5 text-emerald-400 hover:text-emerald-600" />
              </a>
              <a href="#" className="hover:text-emerald-500 transition-colors duration-200">
                <Instagram className="w-5 h-5 text-emerald-400 hover:text-emerald-600" />
              </a>
            </div>
          </motion.div>
          <motion.div {...fadeInUp}>
            <h4 className="text-lg font-semibold mb-6 relative inline-block text-emerald-700">
              Contact Us
              <span className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-emerald-400"></span>
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 text-gray-700 hover:text-emerald-600 transition-colors duration-200">
                <Mail className="w-5 h-5 text-emerald-500" />
                <span>ionia.edu@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-700 hover:text-emerald-600 transition-colors duration-200">
                <MapPin className="w-5 h-5 text-emerald-500" />
                <span>India</span>
              </li>
            </ul>
          </motion.div>
        </div>
        <motion.div className="border-t border-gray-200 mt-12 pt-8 text-center" {...fadeInUp}>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} TestSeries. All rights reserved.
            <span className="mx-2">|</span>
            <Link href="/privacy" className="hover:text-emerald-600 transition-colors duration-200">
              Privacy Policy
            </Link>
            <span className="mx-2">|</span>
            <Link href="/terms" className="hover:text-emerald-600 transition-colors duration-200">
              Terms of Service
            </Link>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}