"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  X, 
  MessageCircle,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ChatMessage {
  _id: string;
  senderId: string;
  senderRole: 'teacher' | 'admin' | 'system';
  messageType: 'text' | 'image' | 'document' | 'assignment_created';
  content: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    fileName: string;
    fileSize: number;
  }[];
  metadata?: {
    assignmentId?: string;
    studentCount?: number;
    [key: string]: any;
  };
  timestamp: Date;
  isRead: boolean;
}

export interface ChatConversation {
  _id: string;
  teacherId: string;
  classId: string;
  title: string;
  description?: string;
  lastMessage?: ChatMessage;
  lastActivity: Date;
  messages: ChatMessage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatInterfaceProps {
  teacherId: string;
  classId: string;
  role: string;
  isEmbedded?: boolean;
  onAssignmentCreated?: (assignmentId: string) => void;
}

export default function ChatInterface({ teacherId, classId, role, isEmbedded = false, onAssignmentCreated }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('ChatInterface props:', { teacherId, classId, role });
  }, [teacherId, classId, role]);

  // Fetch conversations on load
  useEffect(() => {
    if (teacherId && classId && role) {
      fetchConversations();
    }
  }, [teacherId, classId, role]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat?role=${role}&teacherId=${teacherId}&classId=${classId}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
        if (data.data.length > 0 && !activeConversation) {
          setActiveConversation(data.data[0]);
        }
      } else {
        toast.error('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file format`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) {
      toast.error('Please enter a message or attach files');
      return;
    }

    setSendingMessage(true);

    try {
      const formData = new FormData();
      formData.append('role', role);
      formData.append('teacherId', teacherId);
      formData.append('classId', classId);
      formData.append('content', messageText);
      formData.append('messageType', selectedFiles.length > 0 ? 'document' : 'text');

      if (activeConversation) {
        formData.append('conversationId', activeConversation._id);
      } else {
        formData.append('title', `Daily Input - ${new Date().toLocaleDateString()}`);
        formData.append('description', 'Teacher daily input conversation');
      }

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Clear form
        setMessageText('');
        setSelectedFiles([]);
        
        // Refresh conversations to get updated data
        await fetchConversations();
        
        toast.success('Message sent successfully');
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Show authentication message if user data is missing
  if (!teacherId || !classId || !role) {
    if (isEmbedded) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Please Set Your Role
            </h4>
            <p className="text-gray-600 mb-4">
              To use the chat interface, please select your role first.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      );
    }

    if (!isExpanded) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-6 right-6 w-96 h-80 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50"
      >
        {/* Header */}
        <div className="bg-yellow-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Chat Interface</h3>
            <p className="text-yellow-100 text-sm">Authentication Required</p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-yellow-100 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication Message */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Please Set Your Role
            </h4>
            <p className="text-gray-600 mb-4">
              To use the chat interface, please select your role first.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // For embedded mode, render the full chat interface directly
  if (isEmbedded) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Conversation List */}
        {!activeConversation && (
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start your first daily input below</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {conversations.map((conversation) => (
                  <motion.div
                    key={conversation._id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveConversation(conversation)}
                    className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 truncate flex-1">
                        {conversation.title}
                      </h4>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTimestamp(conversation.lastActivity)}
                      </span>
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.content || 'File attachment'}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {conversation.messages.length} messages
                      </span>
                      {!conversation.lastMessage?.isRead && (
                        <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages View */}
        {activeConversation && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveConversation(null)}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                ← Back to conversations
              </button>
            </div>

            <AnimatePresence>
              {activeConversation.messages.map((message, index) => (
                <motion.div
                  key={`${message._id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {message.senderRole === 'teacher' ? 'T' : 'S'}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {message.senderRole === 'teacher' ? 'You' : 'System'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.isRead ? (
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Check className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {message.content && (
                    <p className="text-gray-700 mb-2">{message.content}</p>
                  )}

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2">
                      {message.attachments.map((attachment, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-2 bg-white rounded border"
                        >
                          {attachment.type === 'image' ? (
                            <Image className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-emerald-600" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {attachment.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.fileSize)}
                            </p>
                          </div>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 text-sm"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.metadata?.assignmentId && (
                    <div className="mt-2 p-2 bg-emerald-100 rounded border-l-4 border-emerald-600">
                      <p className="text-sm font-medium text-emerald-800">
                        Assignment Created
                      </p>
                      <p className="text-xs text-emerald-700">
                        Personalized for {message.metadata.studentCount} students
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* File Preview */}
        {selectedFiles.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2 mb-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {selectedFiles.length} file(s) selected
              </span>
            </div>
            <div className="space-y-2 max-h-20 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex items-center space-x-2">
                    {file.type.startsWith('image/') ? (
                      <Image className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className="text-sm text-gray-700 truncate max-w-48">
                      {file.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your daily input here..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={2}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <button
              onClick={sendMessage}
              disabled={sendingMessage || (!messageText.trim() && selectedFiles.length === 0)}
              className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sendingMessage ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            accept="image/*,.pdf,.txt,.doc,.docx"
            className="hidden"
          />
        </div>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50"
    >
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Daily Teacher Input</h3>
          <p className="text-emerald-100 text-sm">
            {activeConversation ? activeConversation.title : 'Start new conversation'}
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-emerald-100 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Conversation List */}
      {!activeConversation && (
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Start your first daily input below</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <motion.div
                  key={conversation._id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveConversation(conversation)}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 truncate flex-1">
                      {conversation.title}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTimestamp(conversation.lastActivity)}
                    </span>
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.content || 'File attachment'}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {conversation.messages.length} messages
                    </span>
                    {!conversation.lastMessage?.isRead && (
                      <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      {activeConversation && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setActiveConversation(null)}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              ← Back to conversations
            </button>
          </div>

          <AnimatePresence>
            {activeConversation.messages.map((message, index) => (
              <motion.div
                key={`${message._id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {message.senderRole === 'teacher' ? 'T' : 'S'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {message.senderRole === 'teacher' ? 'You' : 'System'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.isRead ? (
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Check className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {message.content && (
                  <p className="text-gray-700 mb-2">{message.content}</p>
                )}

                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-2">
                    {message.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 p-2 bg-white rounded border"
                      >
                        {attachment.type === 'image' ? (
                          <Image className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-emerald-600" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(attachment.fileSize)}
                          </p>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 text-sm"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {message.metadata?.assignmentId && (
                  <div className="mt-2 p-2 bg-emerald-100 rounded border-l-4 border-emerald-600">
                    <p className="text-sm font-medium text-emerald-800">
                      Assignment Created
                    </p>
                    <p className="text-xs text-emerald-700">
                      Personalized for {message.metadata.studentCount} students
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 mb-2">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {selectedFiles.length} file(s) selected
            </span>
          </div>
          <div className="space-y-2 max-h-20 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                <div className="flex items-center space-x-2">
                  {file.type.startsWith('image/') ? (
                    <Image className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className="text-sm text-gray-700 truncate max-w-48">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your daily input here..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={2}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-emerald-600 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button
            onClick={sendMessage}
            disabled={sendingMessage || (!messageText.trim() && selectedFiles.length === 0)}
            className="p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sendingMessage ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          accept="image/*,.pdf,.txt,.doc,.docx"
          className="hidden"
        />
      </div>
    </motion.div>
  );
}
