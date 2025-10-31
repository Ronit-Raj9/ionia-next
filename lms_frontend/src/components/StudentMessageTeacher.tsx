"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  User, 
  Clock,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface StudentMessageTeacherProps {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName?: string;
  isEmbedded?: boolean;
}

export default function StudentMessageTeacher({ 
  studentId, 
  studentName, 
  teacherId, 
  teacherName = 'Teacher',
  isEmbedded = false 
}: StudentMessageTeacherProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [studentId, teacherId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages?role=student&userId=${studentId}&teacherId=${teacherId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
      } else {
        console.error('Failed to fetch messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          studentName,
          teacherId,
          teacherName,
          message: newMessage,
          role: 'student'
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
        toast.success('Message sent to teacher!');
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

  return (
    <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-gray-200">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Message Your Teacher</h3>
          <p className="text-sm text-gray-500">Send a direct message to {teacherName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Messages Yet</p>
              <p className="text-sm">Start a conversation with your teacher</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex space-x-3"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{message.message}</p>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.isRead && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">Read</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
          <p className="text-sm text-emerald-700">
            💡 <strong>Tip:</strong> Your teacher will see your message in their inbox. 
            Be clear and specific about what you need help with!
          </p>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to the teacher..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Messages are private between you and your teacher
        </div>
      </div>
    </div>
  );
}
