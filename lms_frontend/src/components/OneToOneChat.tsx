"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Search,
  X,
  Trash2,
  User,
  Upload,
  Image as ImageIcon,
  Paperclip,
  Download,
  Ban,
  Unlock,
  MessageSquare,
  FileText
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
}

interface OneToOneChatProps {
  chatId: string;
  otherUser: {
    userId: string;
    name: string;
    role: 'teacher' | 'student';
  };
  currentUserId: string;
  currentUserRole: 'teacher' | 'student';
  isBlocked?: boolean;
  blockedBy?: string;
}

export default function OneToOneChat({
  chatId,
  otherUser,
  currentUserId,
  currentUserRole,
  isBlocked = false,
  blockedBy
}: OneToOneChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_MESSAGE_LENGTH = 1000;
  const POLLING_INTERVAL = 3000; // 3 seconds

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.chat.messages || []);
      } else {
        if (response.status !== 404) {
          console.error('Failed to fetch messages:', data.error);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return;
      }
      
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
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (filePreviews[index]) {
      URL.revokeObjectURL(filePreviews[index]);
      setFilePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const sendMessage = async () => {
    if ((!messageInput.trim() && selectedFiles.length === 0) || sending) {
      return;
    }

    // Check if blocked
    if (isBlocked && blockedBy !== currentUserId) {
      toast.error('This chat is blocked. You cannot send messages.');
      return;
    }

    setSending(true);
    try {
      let response;

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('content', messageInput.trim());
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        response = await fetch(`/api/chats/${chatId}/message`, {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch(`/api/chats/${chatId}/message`, {
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
        filePreviews.forEach(url => {
          if (url.startsWith('blob:') || url.startsWith('data:')) {
            URL.revokeObjectURL(url);
          }
        });
        setFilePreviews([]);
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

  const deleteMessage = async (messageId: string, deleteForBoth: boolean = false) => {
    const confirmMessage = deleteForBoth 
      ? 'Are you sure you want to delete this message for both parties?'
      : 'Are you sure you want to delete this message?';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/chats/${chatId}/message/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deleteForBoth })
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

  const toggleBlock = async () => {
    const block = !isBlocked;
    try {
      const response = await fetch(`/api/chats/${chatId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ block })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        // Reload to get updated block status
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to update block status');
      }
    } catch (error) {
      console.error('Error blocking/unblocking:', error);
      toast.error('Failed to update block status');
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = messages.filter(msg => 
      msg.content.toLowerCase().includes(query)
    );
    setSearchResults(results);
  };

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
  }, [chatId]);

  useEffect(() => {
    if (!loading && chatId) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, POLLING_INTERVAL);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [chatId, loading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      filePreviews.forEach(url => {
        if (url.startsWith('blob:') || url.startsWith('data:')) {
          try {
            URL.revokeObjectURL(url);
          } catch (e) {
            // Ignore errors
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch();
      }, 500);
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

  const isBlockedByMe = isBlocked && blockedBy === currentUserId;
  const isBlockedByOther = isBlocked && blockedBy !== currentUserId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold">
            {otherUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
            <p className="text-sm text-gray-500">{otherUser.role === 'teacher' ? 'Teacher' : 'Student'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Search messages"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={toggleBlock}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title={isBlocked ? 'Unblock chat' : 'Block chat'}
          >
            {isBlocked ? (
              <Unlock className="w-5 h-5 text-gray-600" />
            ) : (
              <Ban className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Blocked Notice */}
      {isBlockedByOther && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-700">
            This chat has been blocked. You cannot send messages.
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUserId;
            const isHighlighted = showSearch && searchResults.some(r => r._id === message._id);
            
            return (
              <motion.div
                key={message._id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-900'
                  } ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {message.senderName}
                    </p>
                  )}
                  
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === 'image' ? (
                            <img
                              src={attachment.url}
                              alt={attachment.fileName}
                              className="max-w-full rounded-lg cursor-pointer"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                          ) : (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm truncate">{attachment.fileName}</span>
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs opacity-75">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {isOwnMessage && (
                      <button
                        onClick={() => deleteMessage(message._id!, false)}
                        className="ml-2 opacity-75 hover:opacity-100"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative">
                {file.type.startsWith('image/') && filePreviews[index] ? (
                  <div className="relative">
                    <img
                      src={filePreviews[index]}
                      alt={file.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        {isBlockedByOther ? (
          <div className="text-center text-gray-500 py-2">
            You cannot send messages in this blocked chat.
          </div>
        ) : (
          <div className="flex items-end space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex-1 relative">
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
                placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={1}
                disabled={sending}
              />
              {messageInput.length > 0 && (
                <span className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {messageInput.length}/{MAX_MESSAGE_LENGTH}
                </span>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={(!messageInput.trim() && selectedFiles.length === 0) || sending}
              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

