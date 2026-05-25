'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store';
import { Send, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatProps {
  sessionId: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'code';
}

export default function Chat({ sessionId }: ChatProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    const socket = io(WS_URL);
    socketRef.current = socket;

    // Join the session room
    socket.emit('join-room', sessionId);

    // Listen for incoming messages
    socket.on('receive-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicator
    socket.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socket.emit('leave-room', sessionId);
      socket.disconnect();
    };
  }, [sessionId, user?.id]);

  useEffect(() => {
    // Auto-scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      content: inputMessage,
      timestamp: new Date(),
      type: 'text',
    };

    // Add to local state
    setMessages((prev) => [...prev, newMessage]);

    // Send to server
    socketRef.current.emit('send-message', {
      roomId: sessionId,
      message: newMessage,
    });

    setInputMessage('');

    // Stop typing indicator
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        roomId: sessionId,
        isTyping: false,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Send typing indicator
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        roomId: sessionId,
        isTyping: true,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing', {
            roomId: sessionId,
            isTyping: false,
          });
        }
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Chat Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <h3 className="text-white font-semibold">Chat</h3>
        <p className="text-xs text-gray-400">Real-time messaging</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.senderId === user?.id}
          />
        ))}

        {isTyping && (
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
            <span>typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-end space-x-2">
          <button
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwnMessage,
}: {
  message: Message;
  isOwnMessage: boolean;
}) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {!isOwnMessage && (
          <p className="text-xs text-gray-400 mb-1">{message.senderName}</p>
        )}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-100'
          }`}
        >
          {message.type === 'code' ? (
            <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
              <code>{message.content}</code>
            </pre>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
