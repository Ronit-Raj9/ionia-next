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
  Users,
  Settings,
  Plus,
  Crown,
  User,
  Heart,
  ThumbsUp,
  Smile
} from 'lucide-react';
import toast from 'react-hot-toast';
import StudentSelector from './StudentSelector';

export interface ClassChatMessage {
  _id: string;
  senderId: string;
  senderRole: 'teacher' | 'student';
  senderName: string;
  messageType: 'text' | 'image' | 'document' | 'announcement';
  content: string;
  attachments?: {
    type: 'image' | 'document';
    url: string;
    fileName: string;
    fileSize: number;
  }[];
  timestamp: Date;
  isRead: boolean;
  reactions?: {
    userId: string;
    type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
    timestamp: Date;
  }[];
}

export interface ClassChat {
  _id: string;
  classId: string;
  teacherId: string;
  className: string;
  description?: string;
  participants: {
    userId: string;
    role: 'teacher' | 'student';
    name: string;
    joinedAt: Date;
    isActive: boolean;
  }[];
  messages: ClassChatMessage[];
  lastActivity: Date;
  settings: {
    allowStudentMessages: boolean;
    allowFileSharing: boolean;
    moderationEnabled: boolean;
    allowReactions: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ClassChatProps {
  userId: string;
  userName: string;
  role: 'teacher' | 'student' | 'admin';
  classId?: string;
  isEmbedded?: boolean;
}

export default function ClassChat({ userId, userName, role, classId, isEmbedded = false }: ClassChatProps) {
  const [classChats, setClassChats] = useState<ClassChat[]>([]);
  const [activeChat, setActiveChat] = useState<ClassChat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch class chats on load
  useEffect(() => {
    if (userId && role) {
      fetchClassChats();
    }
  }, [userId, role, classId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchClassChats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        role,
        userId,
        ...(classId && { classId })
      });

      const response = await fetch(`/api/class-chat?${params}`);
      const data = await response.json();

      if (data.success) {
        setClassChats(data.data);
        if (data.data.length > 0 && !activeChat) {
          setActiveChat(data.data[0]);
        }
      } else {
        toast.error('Failed to load class chats');
      }
    } catch (error) {
      console.error('Error fetching class chats:', error);
      toast.error('Failed to load class chats');
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

    if (!activeChat) {
      toast.error('Please select a class chat');
      return;
    }

    setSendingMessage(true);

    try {
      const formData = new FormData();
      formData.append('action', 'send_message');
      formData.append('role', role);
      formData.append('userId', userId);
      formData.append('userName', userName);
      formData.append('chatId', activeChat._id);
      formData.append('content', messageText);
      formData.append('messageType', selectedFiles.length > 0 ? 'document' : 'text');

      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/class-chat', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Clear form
        setMessageText('');
        setSelectedFiles([]);
        
        // Refresh chat to get updated messages
        await fetchClassChats();
        
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

  const createClassChat = async (selectedStudents: any[]) => {
    try {
      const formData = new FormData();
      formData.append('action', 'create_chat');
      formData.append('role', role);
      if (!classId || classId === 'unassigned') {
        toast.error('Please create or join a class first');
        return;
      }
      
      formData.append('userId', userId);
      formData.append('userName', userName);
      formData.append('classId', classId);
      formData.append('className', `${userName}'s Class`);
      formData.append('description', 'Class discussion and collaboration space');
      formData.append('selectedStudents', JSON.stringify(selectedStudents.map(s => ({ id: s.id, name: s.name }))));

      const response = await fetch('/api/class-chat', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Class chat created successfully!');
        setShowStudentSelector(false);
        await fetchClassChats();
      } else {
        toast.error(data.error || 'Failed to create class chat');
      }
    } catch (error) {
      console.error('Error creating class chat:', error);
      toast.error('Failed to create class chat');
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

  const getActiveParticipants = () => {
    return activeChat?.participants.filter(p => p.isActive) || [];
  };

  const containerClass = isEmbedded 
    ? "h-full flex flex-col bg-white" 
    : "fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="bg-emerald-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">
              {activeChat ? activeChat.className : 'Class Chat'}
            </h3>
            <p className="text-emerald-100 text-sm">
              {activeChat ? `${getActiveParticipants().length} participants` : 'Select a class'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {activeChat && (
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="text-emerald-100 hover:text-white p-1 rounded"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      {!activeChat && (
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : classChats.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No class chats available</p>
                <p className="text-sm mb-4">
                  {role === 'teacher' 
                    ? 'Create a class chat to get started' 
                    : 'Wait for your teacher to add you to a class chat'
                  }
                </p>
                {role === 'teacher' && (
                  <button
                    onClick={() => setShowStudentSelector(true)}
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Class Chat
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {classChats.map((chat) => (
                <motion.div
                  key={chat._id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveChat(chat)}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 truncate flex-1">
                      {chat.className}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTimestamp(chat.lastActivity)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {chat.messages.length > 0 
                      ? chat.messages[chat.messages.length - 1].content || 'File attachment'
                      : 'No messages yet'
                    }
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {getActiveParticipants().length} participants
                    </span>
                    <span className="text-xs text-gray-500">
                      {chat.messages.length} messages
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages View */}
      {activeChat && (
        <div className="flex-1 flex">
          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${showParticipants ? 'border-r border-gray-200' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setActiveChat(null)}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                ← Back to chats
              </button>
            </div>

            <AnimatePresence>
              {activeChat.messages.map((message, index) => (
                <motion.div
                  key={`${message._id}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg p-3 ${
                    message.senderRole === 'teacher' 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'bg-emerald-50 border-l-4 border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.senderRole === 'teacher' ? 'bg-blue-600' : 'bg-emerald-600'
                      }`}>
                        {message.senderRole === 'teacher' ? (
                          <Crown className="w-4 h-4 text-white" />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {message.senderName}
                        </span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                          message.senderRole === 'teacher' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {message.senderRole}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
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

                  {/* Reactions */}
                  {activeChat.settings.allowReactions && message.reactions && message.reactions.length > 0 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {message.reactions.filter(r => r.type === 'like').length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-gray-500">
                          {message.reactions.filter(r => r.type === 'love').length}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Participants Sidebar */}
          {showParticipants && (
            <div className="w-64 p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Participants</h4>
              <div className="space-y-2">
                {getActiveParticipants().map((participant) => (
                  <div key={participant.userId} className="flex items-center space-x-2 p-2 bg-white rounded border">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      participant.role === 'teacher' ? 'bg-blue-600' : 'bg-emerald-600'
                    }`}>
                      {participant.role === 'teacher' ? (
                        <Crown className="w-4 h-4 text-white" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{participant.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Preview */}
      {activeChat && selectedFiles.length > 0 && (
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
      {activeChat && (activeChat.settings.allowStudentMessages || role === 'teacher') && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here..."
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
            {(activeChat.settings.allowFileSharing || role === 'teacher') && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            )}
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
      )}

      {/* Student Selector Modal */}
      {showStudentSelector && (
        <StudentSelector
          onStudentsSelected={createClassChat}
          onClose={() => setShowStudentSelector(false)}
          classId={classId || 'unassigned'}
          teacherId={userId}
          teacherRole={role}
        />
      )}
    </div>
  );
}
