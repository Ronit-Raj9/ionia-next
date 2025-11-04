"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Folder,
  Download,
  Bookmark,
  BookmarkCheck,
  Search,
  Clock,
  Filter,
  X,
  File,
  Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRole } from '@/contexts/RoleContext';
import { StudyMaterial, StudyMaterialFolder } from '@/lib/db';

interface StudentStudyMaterialsProps {
  classId: string;
  className?: string;
}

export default function StudentStudyMaterials({
  classId,
  className,
}: StudentStudyMaterialsProps) {
  const { user } = useRole();
  const [materials, setMaterials] = useState<(StudyMaterial & { _id: string; isBookmarked?: boolean })[]>([]);
  const [folders, setFolders] = useState<(StudyMaterialFolder & { _id: string })[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'bookmarked'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    if (classId) {
      fetchMaterials();
      fetchFolders();
    }
  }, [classId, selectedFolder, filterType, searchTerm]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      let url = `/api/study-materials?role=student&classId=${classId}`;
      if (selectedFolder) {
        url += `&folderId=${selectedFolder}`;
      } else if (selectedFolder === null) {
        url += `&folderId=root`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let fetchedMaterials = data.data;
        
        // Filter by type
        if (filterType === 'recent') {
          // Show materials from last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          fetchedMaterials = fetchedMaterials.filter((m: any) => {
            const publishedDate = m.publishedAt ? new Date(m.publishedAt) : new Date(m.createdAt);
            return publishedDate >= sevenDaysAgo;
          });
        } else if (filterType === 'bookmarked') {
          fetchedMaterials = fetchedMaterials.filter((m: any) => m.isBookmarked);
        }

        // Sort: recent first
        fetchedMaterials.sort((a: any, b: any) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt);
          const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

        setMaterials(fetchedMaterials);
      } else {
        toast.error(data.error || 'Failed to fetch materials');
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch(`/api/study-materials/folders?classId=${classId}`);
      const data = await response.json();

      if (data.success) {
        setFolders(data.data);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleBookmark = async (materialId: string, isBookmarked: boolean) => {
    try {
      const response = await fetch(`/api/study-materials/${materialId}/bookmark`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        // Update local state
        setMaterials(prev =>
          prev.map(m =>
            m._id.toString() === materialId
              ? { ...m, isBookmarked: data.isBookmarked }
              : m
          )
        );
      } else {
        toast.error(data.error || 'Failed to toggle bookmark');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to toggle bookmark');
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Update download count (optional - could be tracked on backend)
    toast.success('Download started');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const isRecent = (material: StudyMaterial & { _id: string }) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const publishedDate = material.publishedAt 
      ? new Date(material.publishedAt) 
      : new Date(material.createdAt);
    return publishedDate >= sevenDaysAgo;
  };

  // Materials are already filtered by backend search and filterType, no need for additional filtering
  const filteredMaterials = materials;

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Study Materials</h2>
        <p className="text-gray-600">Access materials shared by your teacher</p>
      </div>

      {/* Filters */}
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
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Materials</option>
          <option value="recent">Recently Shared</option>
          <option value="bookmarked">Bookmarked</option>
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

      {/* Folders */}
      {selectedFolder === null && folders.length > 0 && (
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

      {/* Materials List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No materials available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => {
            const recent = isRecent(material);
            return (
              <motion.div
                key={material._id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow ${
                  recent ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    {recent && (
                      <span className="flex items-center space-x-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" />
                        <span>Recent</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleBookmark(material._id.toString(), material.isBookmarked || false)}
                    className={`p-1 ${
                      material.isBookmarked
                        ? 'text-yellow-500'
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    {material.isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5" />
                    ) : (
                      <Bookmark className="w-5 h-5" />
                    )}
                  </button>
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
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <File className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-700 truncate">{file.fileName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</span>
                        <button
                          onClick={() => handleDownload(file.fileUrl, file.fileName)}
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {material.folderName && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 mb-3">
                    <Folder className="w-3 h-3" />
                    <span>{material.folderName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {material.publishedAt
                      ? new Date(material.publishedAt).toLocaleDateString()
                      : new Date(material.createdAt).toLocaleDateString()}
                  </span>
                  {material.teacherName && (
                    <span>by {material.teacherName}</span>
                  )}
                </div>

                {material.linkedAssignmentId && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-1 text-xs text-emerald-600">
                      <LinkIcon className="w-3 h-3" />
                      <span>Linked to assignment</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

