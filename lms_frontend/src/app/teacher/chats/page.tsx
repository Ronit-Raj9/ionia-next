"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, User, Mail, GraduationCap, X, Trash2 } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import OneToOneChat from '@/components/OneToOneChat';
import toast from 'react-hot-toast';

interface Chat {
  _id: string;
  chatId: string;
  otherUser: {
    userId: string;
    name: string;
    role: 'teacher' | 'student';
  };
  lastMessage: {
    content: string;
    timestamp: Date | string;
    senderId: string;
  } | null;
  lastActivity: Date | string;
  isBlocked: boolean;
  blockedBy?: string;
}

interface AvailableUser {
  userId: string;
  name: string;
  email: string;
  role: string;
  classes: Array<{
    _id: string;
    className: string;
    subject: string;
  }>;
  hasChatted: boolean;
}

export default function TeacherChats() {
  const { user } = useRole();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvailableUsers, setShowAvailableUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AvailableUser | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      router.push('/login');
      return;
    }
    fetchChats();
    fetchAvailableUsers();
  }, [user]);

  // Handle deep linking after chats are loaded
  useEffect(() => {
    if (chats.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const chatId = urlParams.get('chatId');
      if (chatId && !selectedChatId) {
        const chat = chats.find(c => c.chatId === chatId);
        if (chat) {
          handleChatSelect(chat);
        }
      }
    }
  }, [chats]);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();
      if (data.success) {
        setChats(data.data.chats || []);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/chats/available-users');
      const data = await response.json();
      if (data.success) {
        setAvailableUsers(data.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const startChat = async (targetUserId: string) => {
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ targetUserId })
      });

      const data = await response.json();
      if (data.success) {
        const newChat = data.data.chat;
        setSelectedChat(newChat);
        setSelectedChatId(newChat.chatId);
        setShowUserProfile(false);
        setShowAvailableUsers(false);
        await fetchChats();
      } else {
        toast.error(data.error || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Chat deleted');
        if (selectedChatId === chatId) {
          setSelectedChatId(null);
          setSelectedChat(null);
        }
        await fetchChats();
      } else {
        toast.error(data.error || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChatId(chat.chatId);
    setSelectedChat(chat);
  };

  const filteredChats = chats.filter(chat =>
    chat.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailableUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (selectedChatId && selectedChat) {
    return (
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <button
            onClick={() => {
              setSelectedChatId(null);
              setSelectedChat(null);
            }}
            className="p-4 border-b hover:bg-gray-100 flex items-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>Back to chats</span>
          </button>
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <div
                key={chat.chatId}
                onClick={() => handleChatSelect(chat)}
                className={`p-4 border-b hover:bg-gray-100 cursor-pointer ${
                  selectedChatId === chat.chatId ? 'bg-emerald-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    {chat.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{chat.otherUser.name}</p>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-500 truncate">{chat.lastMessage.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <OneToOneChat
            chatId={selectedChatId}
            otherUser={selectedChat.otherUser}
            currentUserId={user?.userId || ''}
            currentUserRole="teacher"
            isBlocked={selectedChat.isBlocked}
            blockedBy={selectedChat.blockedBy}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Chats</h1>
        <button
          onClick={() => setShowAvailableUsers(true)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Available Users Modal */}
      {showAvailableUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Start New Chat</h2>
              <button
                onClick={() => {
                  setShowAvailableUsers(false);
                  setSelectedUser(null);
                  setShowUserProfile(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {showUserProfile && selectedUser ? (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowUserProfile(false);
                    setSelectedUser(null);
                  }}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  ← Back to list
                </button>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                      <p className="text-gray-600">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2" />
                      Classes
                    </h4>
                    {selectedUser.classes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.classes.map((cls, idx) => (
                          <div key={idx} className="p-2 bg-gray-50 rounded">
                            <p className="font-medium">{cls.className}</p>
                            <p className="text-sm text-gray-600">{cls.subject}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No classes assigned</p>
                    )}
                  </div>
                  <button
                    onClick={() => startChat(selectedUser.userId)}
                    className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAvailableUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No students found</p>
                ) : (
                  filteredAvailableUsers.map((student) => (
                    <div
                      key={student.userId}
                      onClick={() => {
                        setSelectedUser(student);
                        setShowUserProfile(true);
                      }}
                      className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        {student.hasChatted && (
                          <span className="text-xs text-emerald-600">Has existing chat</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chats List */}
      {chats.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">No chats yet</p>
          <button
            onClick={() => setShowAvailableUsers(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Start your first chat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChats.map((chat) => (
            <motion.div
              key={chat.chatId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleChatSelect(chat)}
              className="bg-white border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold">
                    {chat.otherUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{chat.otherUser.name}</p>
                    <p className="text-xs text-gray-500">Student</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.chatId);
                  }}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {chat.lastMessage && (
                <p className="text-sm text-gray-600 truncate mb-2">{chat.lastMessage.content}</p>
              )}
              {chat.isBlocked && (
                <p className="text-xs text-red-600">Chat blocked</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

