"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  User, 
  Clock, 
  Mail, 
  MailOpen,
  Send,
  X,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentConversation {
  studentId: string;
  studentName: string;
  latestMessage: string;
  timestamp: string;
  unreadCount: number;
  totalMessages: number;
  messages: any[];
}

interface TeacherInboxProps {
  teacherId: string;
  teacherName: string;
  isEmbedded?: boolean;
}

export default function TeacherInbox({ teacherId, teacherName, isEmbedded = false }: TeacherInboxProps) {
  const [conversations, setConversations] = useState<StudentConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<StudentConversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversations();
    // Set up polling to refresh every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [teacherId]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages?role=teacher&userId=${teacherId}`);
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      } else {
        console.error('Failed to fetch conversations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (conversation: StudentConversation) => {
    try {
      const unreadMessages = conversation.messages.filter(m => !m.isRead);
      if (unreadMessages.length === 0) return;

      const messageIds = unreadMessages.map(m => m._id);
      
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds,
          role: 'teacher',
          userId: teacherId
        })
      });

      if (response.ok) {
        // Update local state
        setConversations(prev => 
          prev.map(conv => 
            conv.studentId === conversation.studentId 
              ? { 
                  ...conv, 
                  unreadCount: 0,
                  messages: conv.messages.map(m => ({ ...m, isRead: true }))
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleConversationClick = (conversation: StudentConversation) => {
    setSelectedConversation(conversation);
    markAsRead(conversation);
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      // Note: This would need a different API endpoint for teacher replies
      // For now, just show a toast
      toast.success('Reply feature coming soon! For now, use the General Chat to communicate.');
      setReplyMessage('');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  if (!isEmbedded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <TeacherInboxContent />
        </div>
      </div>
    );
  }

  function TeacherInboxContent() {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
        {!selectedConversation ? (
          // Inbox View
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Student Messages</h2>
                {totalUnread > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
              <button
                onClick={fetchConversations}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loading && conversations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No Messages Yet</p>
                    <p className="text-sm">Students can message you directly from their dashboard</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conversation) => (
                    <motion.div
                      key={conversation.studentId}
                      whileHover={{ backgroundColor: '#f9fafb' }}
                      onClick={() => handleConversationClick(conversation)}
                      className="flex items-center space-x-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.studentName}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {conversation.unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-emerald-500 rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.timestamp)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.latestMessage}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {conversation.totalMessages} message{conversation.totalMessages !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {conversation.unreadCount > 0 ? (
                          <Mail className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <MailOpen className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Conversation View
          <div className="h-full flex flex-col">
            {/* Conversation Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.studentName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.totalMessages} message{selectedConversation.totalMessages !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.map((message, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{message.message}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatTime(message.timestamp)}
                      </span>
                      {!message.isRead && (
                        <span className="text-xs text-emerald-600 font-medium">New</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Section */}
            <div className="border-t border-gray-200 p-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> You can reply to students through the General Chat → Personal Notes section for now. 
                  Full reply functionality is coming soon!
                </p>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply... (coming soon)"
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && sendReply()}
                />
                <button
                  onClick={sendReply}
                  disabled={!replyMessage.trim() || sending}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <TeacherInboxContent />;
}
