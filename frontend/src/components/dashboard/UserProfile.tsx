"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { IUser } from '@/redux/slices/authSlice';
import { FiUser, FiMail, FiAward, FiTrendingUp, FiTarget, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface UserProfileProps {
  user: IUser;
  stats: {
    totalTests: number;
    averageScore: number;
    testsThisWeek: number;
    accuracy: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

const UserProfile: React.FC<UserProfileProps> = ({ user, stats }) => {
  console.log('UserProfile rendering with data:', { user, stats });
  const [error, setError] = useState<string | null>(null);

  // Validate stats
  const validStats = useMemo(() => {
    try {
      if (!stats) {
        return {
          totalTests: 0,
          averageScore: 0,
          testsThisWeek: 0,
          accuracy: 0,
        };
      }
      
      return {
        totalTests: typeof stats.totalTests === 'number' ? stats.totalTests : 0,
        averageScore: typeof stats.averageScore === 'number' ? stats.averageScore : 0,
        testsThisWeek: typeof stats.testsThisWeek === 'number' ? stats.testsThisWeek : 0,
        accuracy: typeof stats.accuracy === 'number' ? stats.accuracy : 0,
      };
    } catch (err) {
      console.error("Error validating stats:", err);
      setError("Error processing user statistics");
      return {
        totalTests: 0,
        averageScore: 0,
        testsThisWeek: 0,
        accuracy: 0,
      };
    }
  }, [stats]);

  useEffect(() => {
    console.log('UserProfile data check:', { user, validStats });
  }, [user, validStats]);

  // Calculate user level based on tests taken and average score
  const calculateLevel = () => {
    try {
      if (validStats.totalTests === 0) return 'Beginner';
      
      const score = validStats.averageScore;
      const tests = validStats.totalTests;
      
      if (tests > 20 && score > 80) return 'Expert';
      if (tests > 10 && score > 70) return 'Advanced';
      if (tests > 5 && score > 60) return 'Intermediate';
      return 'Beginner';
    } catch (err) {
      console.error("Error calculating level:", err);
      return 'Beginner';
    }
  };

  // Get level color and gradient
  const getLevelStyle = () => {
    try {
      const level = calculateLevel();
      switch (level) {
        case 'Expert':
          return {
            badge: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white',
            progress: 'from-purple-500 to-indigo-500'
          };
        case 'Advanced':
          return {
            badge: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
            progress: 'from-blue-500 to-indigo-500'
          };
        case 'Intermediate':
          return {
            badge: 'bg-gradient-to-r from-green-500 to-teal-500 text-white',
            progress: 'from-green-500 to-teal-500'
          };
        default:
          return {
            badge: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
            progress: 'from-gray-500 to-gray-600'
          };
      }
    } catch (err) {
      console.error("Error getting level style:", err);
      return {
        badge: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
        progress: 'from-gray-500 to-gray-600'
      };
    }
  };

  // Get user initial
  const getUserInitial = () => {
    try {
      if (user?.fullName && typeof user.fullName === 'string' && user.fullName.length > 0) {
        return user.fullName.charAt(0).toUpperCase();
      }
      return 'U';
    } catch (err) {
      console.error("Error getting user initial:", err);
      return 'U';
    }
  };

  const levelStyle = getLevelStyle();

  return (
    <motion.div 
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 transform translate-x-32 -translate-y-32">
          <div className="absolute inset-0 bg-white opacity-10 rounded-full"></div>
        </div>
        <motion.div 
          className="relative flex items-center space-x-6"
          variants={itemVariants}
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-white shadow-lg text-blue-600 flex items-center justify-center text-4xl font-bold transform rotate-3 transition-transform duration-300 hover:rotate-6">
              {getUserInitial()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">{user?.fullName || 'User'}</h2>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${levelStyle.badge} shadow-lg`}>
              {calculateLevel()} Level
            </div>
            {error && (
              <motion.p 
                className="text-white text-xs bg-red-500/30 px-3 py-1.5 rounded-full"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {error}
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="p-8">
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FiUser className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium text-gray-900">{user?.username || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FiMail className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <FiAward className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium text-gray-900 capitalize">{user?.role || 'Student'}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Performance Summary
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <FiTarget className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Tests Taken</p>
              <p className="text-2xl font-bold text-gray-900">{validStats.totalTests}</p>
            </motion.div>
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 hover:shadow-lg transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                <FiTrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{validStats.averageScore.toFixed(1)}%</p>
            </motion.div>
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 hover:shadow-lg transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
                <FiCalendar className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Tests This Week</p>
              <p className="text-2xl font-bold text-gray-900">{validStats.testsThisWeek}</p>
            </motion.div>
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-shadow duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                <FiCheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">{validStats.accuracy.toFixed(1)}%</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserProfile; 