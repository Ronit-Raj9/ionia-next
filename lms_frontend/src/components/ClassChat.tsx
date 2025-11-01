"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Search,
  X,
  Trash2,
  MessageSquare,
  Volume2,
  VolumeX,
  AlertCircle,
  User,
  GraduationCap,
  Upload,
  FileText,
  Image as ImageIcon,
  Download,
  Paperclip
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatMessage {
  _id?: string;
  senderId: string;
  senderRole: 'teacher' | 'student';
  senderName: string;
  messageType: 'text' | 'image' | 'document';
  content: string;
  attachments?: Array<{
    type: 'image' | 'document';
    url: string;
    fileName: string;
    fileSize: number;
  }>;
  timestamp: Date | string;
  reactions?: any[];
}

interface Participant {
  userId: string;
  role: 'teacher' | 'student';
  name: string;
  joinedAt: Date | string;
  isActive: boolean;
}

interface ClassChatProps {
  classId: string;
  userId: string;
  userRole: 'teacher' | 'student';
  userName: string;
}

export default function ClassChat({
  classId,
  userId,
  userRole,
  userName
}: ClassChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_MESSAGE_LENGTH = 1000;
  const POLLING_INTERVAL = 3000; // 3 seconds

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/class-chat/${classId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages || []);
        setIsMuted(data.data.isMuted || false);
        setParticipants(data.data.participants || []);
      } else {
        if (response.status !== 404) {
          console.error('Failed to fetch messages:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    // Validate files
    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return;
      }
      
      // Check if file type is allowed (image or document)
      const isImage = file.type.startsWith('image/');
      const isDocument = file.type === 'application/pdf' || 
                        file.type === 'text/plain' ||
                        file.type.includes('document') ||
                        file.type.includes('msword') ||
                        file.type.includes('spreadsheet') ||
                        file.type.includes('presentation');
      
      if (!isImage && !isDocument) {
        toast.error(`${file.name} is not a supported file type`);
        return;
      }
      
      validFiles.push(file);
      
      // Create preview for images
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const result = e.target.result as string;
            newPreviews.push(result);
            setFilePreviews(prev => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove file from selection
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
    
    // Revoke object URL if it exists
    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index]);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Send message
  const sendMessage = async () => {
    if (!messageInput.trim() && selectedFiles.length === 0) {
      return;
    }

    if (messageInput.trim().length > MAX_MESSAGE_LENGTH) {
      toast.error('Message exceeds 1000 characters');
      return;
    }

    if (isMuted && userRole === 'student') {
      toast.error('You are muted and cannot send messages');
      return;
    }

    setSending(true);
    try {
      let response: Response;
      
      if (selectedFiles.length > 0) {
        // Send with files using FormData
        const formData = new FormData();
        formData.append('content', messageInput.trim());
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        response = await fetch(`/api/class-chat/${classId}`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Send text only using JSON
        response = await fetch(`/api/class-chat/${classId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: messageInput.trim()
          })
        });
      }

      const data = await response.json();

      if (data.success) {
        setMessageInput('');
        setSelectedFiles([]);
        // Clean up preview URLs
        filePreviews.forEach(url => {
          if (url.startsWith('blob:') || url.startsWith('data:')) {
            URL.revokeObjectURL(url);
          }
        });
        setFilePreviews([]);
        // Refresh messages immediately
        await fetchMessages();
        scrollToBottom();
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`/api/class-chat/${classId}/message/${messageId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Message deleted');
        await fetchMessages();
      } else {
        toast.error(data.error || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Mute/unmute student
  const toggleMuteStudent = async (studentId: string, currentMuteStatus: boolean) => {
    try {
      const response = await fetch(`/api/class-chat/${classId}/mute`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          mute: !currentMuteStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        await fetchMessages();
      } else {
        toast.error(data.error || 'Failed to update mute status');
      }
    } catch (error) {
      console.error('Error muting/unmuting student:', error);
      toast.error('Failed to update mute status');
    }
  };

  // Search messages
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/class-chat/${classId}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.results || []);
      } else {
        toast.error(data.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
  }, [classId]);

  // Polling for new messages
  useEffect(() => {
    if (!loading && classId) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, POLLING_INTERVAL);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [classId, loading]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup file previews on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => {
        if (url.startsWith('blob:') || url.startsWith('data:')) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            // Ignore errors during cleanup
          }
        }
      });
    };
  }, []);

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500); // Debounce search

      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Class Chat</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Search messages"
          >
            <Search className="w-4 h-4 text-gray-600" />
          </button>
          {showSearch && (
            <div className="absolute top-16 right-4 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {searching && (
                <div className="text-sm text-gray-500 text-center py-2">Searching...</div>
              )}
              {searchResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  <div className="text-xs text-gray-500 mb-2">
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((msg, idx) => (
                    <div
                      key={idx}
                      className="p-2 mb-2 bg-gray-50 rounded text-sm hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        // Scroll to message in main chat
                        const msgId = msg._id || `msg-${msg.timestamp}-${msg.senderId}`;
                        const messageElement = document.getElementById(`message-${msgId}`);
                        if (messageElement) {
                          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          messageElement.classList.add('ring-2', 'ring-emerald-500');
                          setTimeout(() => {
                            messageElement.classList.remove('ring-2', 'ring-emerald-500');
                          }, 2000);
                        }
                        setShowSearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <div className="font-medium text-xs text-gray-600">{msg.senderName}</div>
                      <div className="text-gray-800">{msg.content}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatTimestamp(msg.timestamp)}</div>
                    </div>
                  ))}
                </div>
              )}
              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-2">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Muted warning */}
      {isMuted && userRole === 'student' && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-sm text-amber-800">You are muted and cannot send messages</span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-12 h-12 mb-2" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id || `msg-${message.timestamp}-${message.senderId}`}
              id={`message-${message._id}`}
              className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 ${
                  message.senderId === userId
                    ? 'bg-emerald-600 text-white'
                    : message.senderRole === 'teacher'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex items-center space-x-1">
                    {message.senderRole === 'teacher' ? (
                      <GraduationCap className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium opacity-90">
                      {message.senderId === userId ? 'You' : message.senderName}
                    </span>
                  </div>
                  {(userRole === 'teacher' || message.senderId === userId) && (
                    <button
                      onClick={() => {
                        if (message._id) {
                          deleteMessage(message._id);
                        }
                      }}
                      className="opacity-70 hover:opacity-100 transition-opacity ml-auto"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                        {attachment.type === 'image' ? (
                          <div className="relative">
                            <img
                              src={attachment.url}
                              alt={attachment.fileName}
                              className="max-w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(attachment.url, '_blank')}
                              onError={(e) => {
                                // Fallback if image fails to load
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 px-2">
                              {attachment.fileName} ({formatFileSize(attachment.fileSize)})
                            </div>
                          </div>
                        ) : (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-3 hover:bg-gray-100 transition-colors"
                          >
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {attachment.fileName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(attachment.fileSize)}
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-gray-400" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs opacity-70 mt-1">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Teacher controls */}
      {userRole === 'teacher' && participants.length > 0 && (
        <div className="border-t border-gray-200 p-3 bg-gray-50">
          <div className="text-xs font-medium text-gray-600 mb-2">Manage Students:</div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {participants
              .filter(p => p.role === 'student')
              .map((participant) => (
                <button
                  key={participant.userId}
                  onClick={() => toggleMuteStudent(participant.userId, !participant.isActive)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                    participant.isActive
                      ? 'bg-white text-gray-700 hover:bg-gray-100'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {participant.isActive ? (
                    <Volume2 className="w-3 h-3" />
                  ) : (
                    <VolumeX className="w-3 h-3" />
                  )}
                  <span>{participant.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Input */}
      {(!isMuted || userRole === 'teacher') && (
        <div className="border-t border-gray-200 p-4 bg-white">
          {/* File previews */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {filePreviews[index] ? (
                    <img
                      src={filePreviews[index]}
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload-input"
            />
            <label
              htmlFor="file-upload-input"
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors flex items-center space-x-1"
              title="Upload file (max 10MB)"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
            </label>
            <div className="flex-1">
              <textarea
                value={messageInput}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                    setMessageInput(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {messageInput.length}/{MAX_MESSAGE_LENGTH}
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={(!messageInput.trim() && selectedFiles.length === 0) || sending || messageInput.length > MAX_MESSAGE_LENGTH}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

