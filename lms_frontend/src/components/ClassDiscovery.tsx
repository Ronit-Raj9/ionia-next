"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Users,
  BookOpen,
  Calendar,
  Plus,
  CheckCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  Brain,
  Target,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionChain {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  questionCount: number;
  instructorId: string;
  instructorName: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'draft';
  tags: string[];
}

interface ClassDiscoveryProps {
  userId: string;
  userRole: 'student' | 'instructor' | 'admin';
  userName?: string;
  userEmail?: string;
  onChainJoined?: (chainId: string) => void;
}

export default function ClassDiscovery({ userId, userRole, userName, userEmail, onChainJoined }: ClassDiscoveryProps) {
  const [availableChains, setAvailableChains] = useState<QuestionChain[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  useEffect(() => {
    fetchAvailableChains();
  }, [userId, userRole]);

  const fetchAvailableChains = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chains/available?userId=${userId}&role=${userRole}`);
      const data = await response.json();

      if (data.success) {
        setAvailableChains(data.data);
      } else {
        toast.error('Failed to load available question chains');
        setAvailableChains([]);
      }
    } catch (error) {
      console.error('Error fetching available question chains:', error);
      toast.error('Failed to load available question chains');
      setAvailableChains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChain = async (chainId: string, chainTitle: string) => {
    setJoining(chainId);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          chainId: chainId,
          role: userRole,
          action: 'start'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully started ${chainTitle}!`);
        onChainJoined?.(chainId);
        fetchAvailableChains(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to start question chain');
      }
    } catch (error) {
      console.error('Error starting question chain:', error);
      toast.error('Failed to start question chain');
    } finally {
      setJoining(null);
    }
  };

  const filteredChains = availableChains.filter(chain => {
    const matchesSearch = chain.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chain.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chain.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = !filterSubject || chain.subject === filterSubject;
    const matchesDifficulty = !filterDifficulty || chain.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const subjects = ['physics', 'chemistry', 'mathematics', 'biology', 'english', 'computer_science'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discover Question Chains</h2>
          <p className="text-gray-600">Start learning with available question chains</p>
        </div>
        <button
          onClick={fetchAvailableChains}
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search question chains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Subjects</option>
          {subjects.map(subject => (
            <option key={subject} value={subject}>
              {subject.charAt(0).toUpperCase() + subject.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">All Levels</option>
          {difficulties.map(difficulty => (
            <option key={difficulty} value={difficulty}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Question Chains Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredChains.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChains.map((chain) => (
            <motion.div
              key={chain._id}
              whileHover={{ scale: 1.02 }}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {chain.title}
                </h3>
                {chain.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {chain.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                  <span className="bg-emerald-100 text-blue-800 px-2 py-1 rounded">
                    {chain.subject.charAt(0).toUpperCase() + chain.subject.slice(1).replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    chain.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    chain.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {chain.difficulty.charAt(0).toUpperCase() + chain.difficulty.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-gray-700">
                    {chain.questionCount} questions
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-gray-700">
                    {chain.estimatedTime} min
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Instructor:</span>
                  <span className="text-sm font-medium">
                    {chain.instructorName}
                  </span>
                </div>
              </div>

              {chain.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {chain.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {chain.tags.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{chain.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleJoinChain(chain._id, chain.title)}
                disabled={joining === chain._id}
                className="w-full px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-md hover:bg-emerald-600 disabled:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                {joining === chain._id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Start Learning</span>
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterSubject || filterDifficulty ? 'No question chains found' : 'No available question chains'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterSubject || filterDifficulty 
              ? 'Try adjusting your search or filter criteria'
              : 'There are no question chains available at the moment. Check back later or ask your instructor to create one.'
            }
          </p>
          {(searchTerm || filterSubject || filterDifficulty) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterSubject('');
                setFilterDifficulty('');
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}


