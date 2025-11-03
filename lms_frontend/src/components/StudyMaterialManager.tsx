"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Link,
  Upload,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ExternalLink,
  FileText,
  Image,
  Video,
  Download,
  Eye,
  Star,
  Tag,
  Calendar,
  User,
  Bookmark,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudyMaterial {
  id: string;
  title: string;
  type: 'textbook' | 'video' | 'article' | 'exercise' | 'lab' | 'reference' | 'other';
  description: string;
  url?: string;
  fileUrl?: string;
  subject: string;
  grade: string;
  topic: string;
  tags: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  author?: string;
  publisher?: string;
  isbn?: string;
  chapter?: string;
  pageRange?: string;
  createdAt: Date;
  updatedAt: Date;
  isBookmarked: boolean;
  rating?: number;
  usageCount: number;
}

interface StudyMaterialManagerProps {
  subject: string;
  grade: string;
  topic: string;
  onMaterialSelect?: (material: StudyMaterial) => void;
  selectedMaterials?: StudyMaterial[];
  onMaterialsChange?: (materials: StudyMaterial[]) => void;
  isCreatingAssignment?: boolean;
}

export default function StudyMaterialManager({
  subject,
  grade,
  topic,
  onMaterialSelect,
  selectedMaterials = [],
  onMaterialsChange,
  isCreatingAssignment = false
}: StudyMaterialManagerProps) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form state for adding/editing materials
  const [formData, setFormData] = useState({
    title: '',
    type: 'textbook' as StudyMaterial['type'],
    description: '',
    url: '',
    subject: subject,
    grade: grade,
    topic: topic,
    tags: [] as string[],
    difficulty: 'intermediate' as StudyMaterial['difficulty'],
    estimatedTime: 30,
    author: '',
    publisher: '',
    isbn: '',
    chapter: '',
    pageRange: ''
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, [subject, grade, topic]);

  useEffect(() => {
    filterMaterials();
  }, [materials, searchTerm, filterType, filterDifficulty]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockMaterials: StudyMaterial[] = [
        {
          id: '1',
          title: 'Algebra Fundamentals',
          type: 'textbook',
          description: 'Comprehensive guide to algebraic concepts and problem-solving techniques',
          url: 'https://example.com/algebra-fundamentals',
          subject: subject,
          grade: grade,
          topic: topic,
          tags: ['algebra', 'fundamentals', 'problem-solving'],
          difficulty: 'intermediate',
          estimatedTime: 45,
          author: 'Dr. John Smith',
          publisher: 'Educational Press',
          isbn: '978-1234567890',
          chapter: 'Chapter 3',
          pageRange: '45-67',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          isBookmarked: false,
          rating: 4.5,
          usageCount: 23
        },
        {
          id: '2',
          title: 'Quadratic Equations Video Tutorial',
          type: 'video',
          description: 'Step-by-step video explanation of quadratic equations with examples',
          url: 'https://youtube.com/watch?v=example',
          subject: subject,
          grade: grade,
          topic: topic,
          tags: ['quadratic', 'equations', 'video', 'tutorial'],
          difficulty: 'basic',
          estimatedTime: 20,
          author: 'Math Academy',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          isBookmarked: true,
          rating: 4.8,
          usageCount: 156
        },
        {
          id: '3',
          title: 'Practice Problems Set',
          type: 'exercise',
          description: 'Collection of practice problems with varying difficulty levels',
          url: 'https://example.com/practice-problems',
          subject: subject,
          grade: grade,
          topic: topic,
          tags: ['practice', 'problems', 'exercises'],
          difficulty: 'advanced',
          estimatedTime: 60,
          author: 'Problem Solvers Inc.',
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-08'),
          isBookmarked: false,
          rating: 4.2,
          usageCount: 89
        }
      ];

      setMaterials(mockMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch study materials');
    } finally {
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    let filtered = materials;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(material => material.type === filterType);
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(material => material.difficulty === filterDifficulty);
    }

    setFilteredMaterials(filtered);
  };

  const handleAddMaterial = async () => {
    try {
      const newMaterial: StudyMaterial = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isBookmarked: false,
        usageCount: 0
      };

      setMaterials(prev => [...prev, newMaterial]);
      setShowAddForm(false);
      resetForm();
      toast.success('Study material added successfully');
    } catch (error) {
      console.error('Error adding material:', error);
      toast.error('Failed to add study material');
    }
  };

  const handleEditMaterial = async (material: StudyMaterial) => {
    try {
      setMaterials(prev => prev.map(m => 
        m.id === material.id 
          ? { ...material, updatedAt: new Date() }
          : m
      ));
      setEditingMaterial(null);
      toast.success('Study material updated successfully');
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update study material');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this study material?')) {
      try {
        setMaterials(prev => prev.filter(m => m.id !== id));
        toast.success('Study material deleted successfully');
      } catch (error) {
        console.error('Error deleting material:', error);
        toast.error('Failed to delete study material');
      }
    }
  };

  const handleToggleBookmark = async (id: string) => {
    try {
      setMaterials(prev => prev.map(m => 
        m.id === id 
          ? { ...m, isBookmarked: !m.isBookmarked }
          : m
      ));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleMaterialSelect = (material: StudyMaterial) => {
    if (isCreatingAssignment && onMaterialsChange) {
      const isSelected = selectedMaterials.some(m => m.id === material.id);
      if (isSelected) {
        onMaterialsChange(selectedMaterials.filter(m => m.id !== material.id));
      } else {
        onMaterialsChange([...selectedMaterials, material]);
      }
    } else if (onMaterialSelect) {
      onMaterialSelect(material);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'textbook',
      description: '',
      url: '',
      subject: subject,
      grade: grade,
      topic: topic,
      tags: [],
      difficulty: 'intermediate',
      estimatedTime: 30,
      author: '',
      publisher: '',
      isbn: '',
      chapter: '',
      pageRange: ''
    });
  };

  const getTypeIcon = (type: StudyMaterial['type']) => {
    switch (type) {
      case 'textbook': return <BookOpen className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      case 'exercise': return <Bookmark className="w-4 h-4" />;
      case 'lab': return <Image className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: StudyMaterial['difficulty']) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
          <p className="text-gray-600">
            Manage and organize study materials for {subject} - {topic}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Material</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="textbook">Textbook</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="exercise">Exercise</option>
          <option value="lab">Lab</option>
          <option value="reference">Reference</option>
        </select>

        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Difficulties</option>
          <option value="basic">Basic</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Materials Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredMaterials.map((material) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow ${
                isCreatingAssignment && selectedMaterials.some(m => m.id === material.id)
                  ? 'ring-2 ring-emerald-500 border-emerald-500'
                  : ''
              }`}
            >
              {viewMode === 'grid' ? (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(material.type)}
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {material.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleBookmark(material.id)}
                        className={`p-1 rounded ${
                          material.isBookmarked 
                            ? 'text-yellow-500' 
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingMaterial(material)}
                        className="p-1 text-gray-400 hover:text-emerald-500"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {material.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {material.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(material.difficulty)}`}>
                      {material.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">
                      {material.estimatedTime} min
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {material.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {material.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{material.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {material.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{material.rating}</span>
                        </div>
                      )}
                      <span>{material.usageCount} uses</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {material.url && (
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-emerald-500"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleMaterialSelect(material)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          isCreatingAssignment && selectedMaterials.some(m => m.id === material.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {isCreatingAssignment && selectedMaterials.some(m => m.id === material.id)
                          ? 'Selected'
                          : 'Select'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(material.type)}
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {material.type}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{material.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{material.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(material.difficulty)}`}>
                        {material.difficulty}
                      </span>
                      <span className="text-sm text-gray-500">{material.estimatedTime} min</span>
                      {material.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm">{material.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleBookmark(material.id)}
                      className={`p-1 rounded ${
                        material.isBookmarked 
                          ? 'text-yellow-500' 
                          : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingMaterial(material)}
                      className="p-1 text-gray-400 hover:text-emerald-500"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMaterialSelect(material)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        isCreatingAssignment && selectedMaterials.some(m => m.id === material.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isCreatingAssignment && selectedMaterials.some(m => m.id === material.id)
                        ? 'Selected'
                        : 'Select'
                      }
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Material Modal */}
      <AnimatePresence>
        {(showAddForm || editingMaterial) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold mb-4">
                {editingMaterial ? 'Edit Study Material' : 'Add New Study Material'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={editingMaterial ? editingMaterial.title : formData.title}
                      onChange={(e) => editingMaterial 
                        ? setEditingMaterial({...editingMaterial, title: e.target.value})
                        : setFormData({...formData, title: e.target.value})
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter material title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={editingMaterial ? editingMaterial.type : formData.type}
                      onChange={(e) => editingMaterial 
                        ? setEditingMaterial({...editingMaterial, type: e.target.value as StudyMaterial['type']})
                        : setFormData({...formData, type: e.target.value as StudyMaterial['type']})
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="textbook">Textbook</option>
                      <option value="video">Video</option>
                      <option value="article">Article</option>
                      <option value="exercise">Exercise</option>
                      <option value="lab">Lab</option>
                      <option value="reference">Reference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={editingMaterial ? editingMaterial.description : formData.description}
                    onChange={(e) => editingMaterial 
                      ? setEditingMaterial({...editingMaterial, description: e.target.value})
                      : setFormData({...formData, description: e.target.value})
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter material description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      value={editingMaterial ? editingMaterial.url || '' : formData.url}
                      onChange={(e) => editingMaterial 
                        ? setEditingMaterial({...editingMaterial, url: e.target.value})
                        : setFormData({...formData, url: e.target.value})
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={editingMaterial ? editingMaterial.difficulty : formData.difficulty}
                      onChange={(e) => editingMaterial 
                        ? setEditingMaterial({...editingMaterial, difficulty: e.target.value as StudyMaterial['difficulty']})
                        : setFormData({...formData, difficulty: e.target.value as StudyMaterial['difficulty']})
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      value={editingMaterial ? editingMaterial.author || '' : formData.author}
                      onChange={(e) => editingMaterial 
                        ? setEditingMaterial({...editingMaterial, author: e.target.value})
                        : setFormData({...formData, author: e.target.value})
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Author name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={editingMaterial ? editingMaterial.estimatedTime : formData.estimatedTime}
                      onChange={(e) => editingMaterial 
                        ? setEditingMaterial({...editingMaterial, estimatedTime: parseInt(e.target.value)})
                        : setFormData({...formData, estimatedTime: parseInt(e.target.value)})
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingMaterial ? editingMaterial.tags : formData.tags).map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-blue-800 rounded text-sm"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => editingMaterial 
                            ? setEditingMaterial({...editingMaterial, tags: editingMaterial.tags.filter(t => t !== tag)})
                            : removeTag(tag)
                          }
                          className="text-emerald-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Add tag"
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingMaterial(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => editingMaterial 
                    ? handleEditMaterial(editingMaterial)
                    : handleAddMaterial()
                  }
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  {editingMaterial ? 'Update' : 'Add'} Material
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
