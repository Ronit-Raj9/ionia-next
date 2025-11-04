"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Folder,
  FolderPlus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Send,
  Download,
  X,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  AlertCircle,
  File,
  Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRole } from '@/contexts/RoleContext';
import { StudyMaterial, StudyMaterialFolder } from '@/lib/db';
import { validateStudyMaterialFile } from '@/lib/cloudinary';

interface TeacherStudyMaterialsProps {
  classId?: string; // Make optional - will be selected internally if not provided
  className?: string;
}

interface ClassOption {
  _id: string;
  className: string;
  subject?: string;
  grade?: string;
  studentCount?: number;
}

export default function TeacherStudyMaterials({
  classId: initialClassId,
  className,
}: TeacherStudyMaterialsProps) {
  const { user } = useRole();
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || '');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [materials, setMaterials] = useState<(StudyMaterial & { _id: string })[]>([]);
  const [folders, setFolders] = useState<(StudyMaterialFolder & { _id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // UI State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial & { _id: string } | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  
  // Form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    folderId: '',
    status: 'draft' as 'draft' | 'published',
    linkedAssignmentId: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [folderForm, setFolderForm] = useState({
    folderName: '',
    description: '',
  });

  // Fetch teacher's classes on mount
  useEffect(() => {
    if (user?.userId && user?.role === 'teacher') {
      fetchTeacherClasses();
    }
  }, [user]);

  // Set initial class if provided
  useEffect(() => {
    if (initialClassId && !selectedClassId) {
      setSelectedClassId(initialClassId);
    }
  }, [initialClassId]);

  // Fetch materials and folders when class is selected
  useEffect(() => {
    if (selectedClassId) {
      fetchMaterials();
      fetchFolders();
    }
  }, [selectedClassId, statusFilter, selectedFolder, searchTerm]);

  const fetchTeacherClasses = async () => {
    if (!user?.userId) return;
    
    setClassesLoading(true);
    try {
      const response = await fetch(`/api/classes?role=teacher&teacherId=${user.userId}`);
      const data = await response.json();

      if (data.success && data.data) {
        const classOptions: ClassOption[] = data.data.map((cls: any) => ({
          _id: cls._id?.toString() || '',
          className: cls.className || 'Unnamed Class',
          subject: cls.subject,
          grade: cls.grade,
          studentCount: cls.studentIds?.length || 0,
        }));
        setClasses(classOptions);
        
        // Auto-select first class if no class is selected
        if (!selectedClassId && classOptions.length > 0) {
          setSelectedClassId(classOptions[0]._id);
        }
      } else {
        toast.error(data.error || 'Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchMaterials = async () => {
    // Don't fetch if no class is selected or if classId is invalid
    if (!selectedClassId || selectedClassId.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(selectedClassId)) {
      setMaterials([]);
      return;
    }

    setLoading(true);
    try {
      let url = `/api/study-materials?role=teacher&classId=${selectedClassId}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (selectedFolder) {
        // Validate folderId is a valid ObjectId before adding to URL
        if (/^[0-9a-fA-F]{24}$/.test(selectedFolder)) {
          url += `&folderId=${selectedFolder}`;
        }
      } else if (selectedFolder === null) {
        url += `&folderId=root`;
      }
      if (searchTerm && searchTerm.trim() !== '') {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setMaterials(data.data);
      } else {
        // Only show error if it's not a validation error (400)
        if (response.status !== 400) {
          toast.error(data.error || 'Failed to fetch materials');
        }
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    // Don't fetch if no class is selected or if classId is invalid
    if (!selectedClassId || selectedClassId.trim() === '' || !/^[0-9a-fA-F]{24}$/.test(selectedClassId)) {
      setFolders([]);
      return;
    }

    try {
      const response = await fetch(`/api/study-materials/folders?classId=${selectedClassId}`);
      const data = await response.json();

      if (data.success) {
        setFolders(data.data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateStudyMaterialFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class first');
      return;
    }

    if (!uploadForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('classId', selectedClassId);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('status', uploadForm.status);
      if (uploadForm.folderId) {
        formData.append('folderId', uploadForm.folderId);
      }
      if (uploadForm.linkedAssignmentId) {
        formData.append('linkedAssignmentId', uploadForm.linkedAssignmentId);
      }

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/study-materials', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Material uploaded successfully');
        setShowUploadModal(false);
        setSelectedFiles([]);
        setUploadForm({
          title: '',
          description: '',
          folderId: '',
          status: 'draft',
          linkedAssignmentId: '',
        });
        fetchMaterials();
      } else {
        toast.error(data.error || 'Failed to upload material');
      }
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class first');
      return;
    }

    if (!folderForm.folderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      const response = await fetch('/api/study-materials/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClassId,
          folderName: folderForm.folderName,
          description: folderForm.description,
          parentFolderId: selectedFolder || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Folder created successfully');
        setShowFolderModal(false);
        setFolderForm({ folderName: '', description: '' });
        fetchFolders();
      } else {
        toast.error(data.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handlePublish = async (materialId: string) => {
    try {
      const response = await fetch(`/api/study-materials/${materialId}/publish`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Material published and broadcast to class');
        fetchMaterials();
      } else {
        toast.error(data.error || 'Failed to publish material');
      }
    } catch (error) {
      console.error('Error publishing material:', error);
      toast.error('Failed to publish material');
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this material? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/study-materials/${materialId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Material deleted successfully');
        fetchMaterials();
      } else {
        toast.error(data.error || 'Failed to delete material');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const handleEdit = async () => {
    if (!editingMaterial) return;
    if (!uploadForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const response = await fetch(`/api/study-materials/${editingMaterial._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadForm.title,
          description: uploadForm.description,
          folderId: uploadForm.folderId || null,
          status: uploadForm.status,
          linkedAssignmentId: uploadForm.linkedAssignmentId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Material updated successfully');
        setShowEditModal(false);
        setEditingMaterial(null);
        fetchMaterials();
      } else {
        toast.error(data.error || 'Failed to update material');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error('Failed to update material');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm('Are you sure you want to delete this folder? Materials in this folder will remain but will be moved to root.')) {
      return;
    }

    try {
      const response = await fetch(`/api/study-materials/folders/${folderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Folder deleted successfully');
        fetchFolders();
        if (selectedFolder === folderId) {
          setSelectedFolder(null);
        }
      } else {
        toast.error(data.error || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const openEditModal = (material: StudyMaterial & { _id: string }) => {
    setEditingMaterial(material);
    setUploadForm({
      title: material.title,
      description: material.description || '',
      folderId: material.folderId?.toString() || '',
      status: material.status,
      linkedAssignmentId: material.linkedAssignmentId || '',
    });
    setShowEditModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Materials are already filtered by backend search, no need for additional filtering
  const filteredMaterials = materials;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
          <p className="text-gray-600">Manage and broadcast materials to your class</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFolderModal(true)}
            disabled={!selectedClassId}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Folder</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={!selectedClassId}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Materials</span>
          </button>
        </div>
      </div>

      {/* Class Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class *
        </label>
        {classesLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
            <span className="text-sm text-gray-600">Loading classes...</span>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-sm text-gray-600">
            No classes found. Please create a class first.
          </div>
        ) : (
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedFolder(null); // Reset folder selection when class changes
              setMaterials([]); // Clear materials while loading new ones
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">-- Select a Class --</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.className}
                {cls.subject && ` - ${cls.subject}`}
                {cls.grade && ` (Grade ${cls.grade})`}
                {cls.studentCount !== undefined && ` - ${cls.studentCount} students`}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedClassId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Please select a class to view and manage study materials.
            </p>
          </div>
        </div>
      )}

      {/* Filters - Only show when class is selected */}
      {selectedClassId && (
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
        </select>

        <select
          value={selectedFolder || 'root'}
          onChange={(e) => setSelectedFolder(e.target.value === 'root' ? null : e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="root">All Folders</option>
          {folders.map(folder => (
            <option key={folder._id.toString()} value={folder._id.toString()}>
              {folder.folderName}
            </option>
          ))}
        </select>
      </div>
      )}

      {/* Folders - Only show when class is selected */}
      {selectedClassId && selectedFolder === null && folders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Folders</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map(folder => (
              <motion.div
                key={folder._id.toString()}
                whileHover={{ scale: 1.05 }}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedFolder(folder._id.toString())}
              >
                <Folder className="w-8 h-8 text-emerald-600 mb-2" />
                <p className="text-sm font-medium text-gray-900 truncate">{folder.folderName}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder._id.toString());
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      {selectedFolder && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => setSelectedFolder(null)}
            className="hover:text-emerald-600"
          >
            All Folders
          </button>
          <span>/</span>
          <span>
            {folders.find(f => f._id.toString() === selectedFolder)?.folderName}
          </span>
        </div>
      )}

      {/* Materials List - Only show when class is selected */}
      {selectedClassId && (
        loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No materials found</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 text-emerald-600 hover:text-emerald-700"
            >
              Upload your first material
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((material) => (
              <motion.div
                key={material._id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      material.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {material.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(material)}
                      className="p-1 text-gray-400 hover:text-emerald-500"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(material._id.toString())}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {material.title}
                </h3>
                
                {material.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {material.description}
                  </p>
                )}

                <div className="space-y-2 mb-3">
                  {material.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate flex-1">{file.fileName}</span>
                      <span>{formatFileSize(file.fileSize)}</span>
                    </div>
                  ))}
                </div>

                {material.folderName && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 mb-3">
                    <Folder className="w-3 h-3" />
                    <span>{material.folderName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                  {material.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(material._id.toString())}
                      className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700"
                    >
                      <Send className="w-3 h-3" />
                      <span>Publish</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => !uploading && setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">Upload Study Materials</h3>
                  {selectedClassId && (
                    <p className="text-sm text-gray-600 mt-1">
                      Publishing to: <span className="font-medium">{classes.find(c => c._id === selectedClassId)?.className || 'Selected Class'}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!selectedClassId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Please select a class first before uploading materials.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter material title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Folder
                    </label>
                    <select
                      value={uploadForm.folderId}
                      onChange={(e) => setUploadForm({ ...uploadForm, folderId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Root (No folder)</option>
                      {folders.map(folder => (
                        <option key={folder._id.toString()} value={folder._id.toString()}>
                          {folder.folderName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={uploadForm.status}
                      onChange={(e) => setUploadForm({ ...uploadForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="draft">Draft (Not visible to students)</option>
                      <option value="published">Published (Visible to students)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Files * (Max 20MB per file)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        Click to select files or drag and drop
                      </span>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <File className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            disabled={uploading}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowFolderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold">Create Folder</h3>
                {selectedClassId && (
                  <p className="text-sm text-gray-600 mt-1">
                      For class: <span className="font-medium">{classes.find(c => c._id === selectedClassId)?.className || 'Selected Class'}</span>
                  </p>
                )}
              </div>
              {!selectedClassId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Please select a class first before creating a folder.
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder Name *
                  </label>
                  <input
                    type="text"
                    value={folderForm.folderName}
                    onChange={(e) => setFolderForm({ ...folderForm, folderName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter folder name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={folderForm.description}
                    onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingMaterial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Edit Material</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Folder
                    </label>
                    <select
                      value={uploadForm.folderId}
                      onChange={(e) => setUploadForm({ ...uploadForm, folderId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Root (No folder)</option>
                      {folders.map(folder => (
                        <option key={folder._id.toString()} value={folder._id.toString()}>
                          {folder.folderName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={uploadForm.status}
                      onChange={(e) => setUploadForm({ ...uploadForm, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Files
                  </label>
                  <div className="space-y-2">
                    {editingMaterial.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <File className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{file.fileName}</span>
                          <span className="text-xs text-gray-500">
                            ({formatFileSize(file.fileSize)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Update
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

