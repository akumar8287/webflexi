'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { Send, Code2, Copy, Check } from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useSessionSocket } from '@/context/SessionSocketContext';

interface ChatProps {
  sessionId: string;
  onUnreadChange?: (count: number) => void;
  isVisible?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'code' | 'system';
  language?: string;
}

function detectCodeContent(text: string): { isCode: boolean; language: string; content: string } {
  const fencedMatch = text.match(/^```(\w*)\n?([\s\S]*?)```$/);
  if (fencedMatch) {
    return { isCode: true, language: fencedMatch[1] || 'plaintext', content: fencedMatch[2].trim() };
  }
  return { isCode: false, language: '', content: text };
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

function needsDateSeparator(prev: Message | undefined, curr: Message): boolean {
  if (!prev) return true;
  return getDateLabel(new Date(prev.timestamp)) !== getDateLabel(new Date(curr.timestamp));
}

function isSameGroup(prev: Message | undefined, curr: Message): boolean {
  if (!prev) return false;
  if (prev.type === 'system' || curr.type === 'system') return false;
  if (prev.senderId !== curr.senderId) return false;
  const diff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}

export default function Chat({ sessionId, onUnreadChange, isVisible = true }: ChatProps) {
  const { user } = useAuthStore();
  const { socket, setSystemMessageHandler } = useSessionSocket();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [isCodeMode, setIsCodeMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unreadRef = useRef(0);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    if (!isVisible) {
      unreadRef.current += 1;
      onUnreadChange?.(unreadRef.current);
    }
  }, [isVisible, onUnreadChange]);

  // Register system message handler with context
  useEffect(() => {
    setSystemMessageHandler((text: string) => {
      addMessage({
        id: `sys-${Date.now()}-${Math.random()}`,
        senderId: 'system',
        senderName: 'System',
        content: text,
        timestamp: new Date(),
        type: 'system',
      });
    });
  }, [setSystemMessageHandler, addMessage]);

  // Reset unread when visible
  useEffect(() => {
    if (isVisible) {
      unreadRef.current = 0;
      onUnreadChange?.(0);
    }
  }, [isVisible, onUnreadChange]);

  useEffect(() => {
    if (!socket) return;

    const onReceiveMessage = (message: Message) => {
      addMessage({ ...message, timestamp: new Date(message.timestamp) });
    };

    const onUserTyping = (data: { userId: string; name: string; isTyping: boolean }) => {
      if (data.userId === socket.id) return;
      setTypingNames((prev) =>
        data.isTyping
          ? prev.includes(data.name) ? prev : [...prev, data.name]
          : prev.filter((n) => n !== data.name)
      );
    };

    socket.on('receive-message', onReceiveMessage);
    socket.on('user-typing', onUserTyping);

    return () => {
      socket.off('receive-message', onReceiveMessage);
      socket.off('user-typing', onUserTyping);
    };
  }, [socket, addMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || !socket || !user) return;

    const { isCode, language, content } = detectCodeContent(inputMessage.trim());
    const finalContent = isCodeMode ? inputMessage.trim() : content;

    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      content: finalContent,
      timestamp: new Date(),
      type: isCodeMode ? 'code' : isCode ? 'code' : 'text',
      language: isCodeMode ? 'plaintext' : language,
    };

    // Add locally (sender doesn't receive own message from server anymore)
    addMessage(newMessage);

    socket.emit('send-message', { roomId: sessionId, message: newMessage });
    setInputMessage('');
    setIsCodeMode(false);

    // Stop typing
    socket.emit('typing', { roomId: sessionId, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [inputMessage, socket, user, sessionId, isCodeMode, addMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (!socket) return;
    socket.emit('typing', { roomId: sessionId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { roomId: sessionId, isTyping: false });
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <h3 className="text-white font-semibold text-sm">Chat</h3>
        <p className="text-xs text-gray-500">Session messaging</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-10">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation</p>
          </div>
        )}

        {messages.map((message, idx) => {
          const prev = messages[idx - 1];
          const grouped = isSameGroup(prev, message);
          const showDateSep = needsDateSeparator(prev, message);

          return (
            <div key={message.id}>
              {showDateSep && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-gray-700" />
                  <span className="text-xs text-gray-500">{getDateLabel(new Date(message.timestamp))}</span>
                  <div className="flex-1 h-px bg-gray-700" />
                </div>
              )}
              {message.type === 'system' ? (
                <SystemMessage text={message.content} />
              ) : (
                <MessageBubble
                  message={message}
                  isOwnMessage={message.senderId === user?.id}
                  grouped={grouped}
                />
              )}
            </div>
          );
        })}

        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 text-gray-500 text-xs pl-1">
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
            <span>
              {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-3 flex-shrink-0">
        {/* Code mode banner */}
        {isCodeMode && (
          <div className="mb-2 flex items-center justify-between bg-gray-700 rounded px-2 py-1">
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Code2 className="h-3 w-3" /> Code snippet mode
            </span>
            <button
              onClick={() => setIsCodeMode(false)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            onClick={() => setIsCodeMode((v) => !v)}
            className={`p-2 rounded transition-colors flex-shrink-0 ${isCodeMode ? 'text-blue-400 bg-gray-700' : 'text-gray-500 hover:text-gray-300'}`}
            title="Send code snippet"
          >
            <Code2 className="h-4 w-4" />
          </button>

          <textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isCodeMode ? 'Paste your code here…' : 'Type a message… (or wrap in ``` for code)'}
            className={`flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm ${isCodeMode ? 'font-mono' : ''}`}
            rows={isCodeMode ? 3 : 1}
            style={{ minHeight: '36px', maxHeight: isCodeMode ? '120px' : '80px' }}
          />

          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-gray-600 mt-1.5">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function SystemMessage({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center my-2">
      <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
        {text}
      </span>
    </div>
  );
}

function CodeBlock({ content, language }: { content: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-1 rounded-md overflow-hidden border border-gray-600">
      <div className="flex items-center justify-between bg-gray-800 px-3 py-1">
        <span className="text-xs text-gray-400">{language || 'code'}</span>
        <button
          onClick={copy}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-900 p-3 overflow-x-auto text-xs text-green-300 font-mono whitespace-pre">
        <code>{content}</code>
      </pre>
    </div>
  );
}

function MessageBubble({
  message,
  isOwnMessage,
  grouped,
}: {
  message: Message;
  isOwnMessage: boolean;
  grouped: boolean;
}) {
  const showMeta = !grouped;

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${grouped ? 'mt-0.5' : 'mt-3'}`}>
      <div className={`max-w-[78%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {showMeta && !isOwnMessage && (
          <p className="text-xs text-gray-400 mb-0.5 ml-1">{message.senderName}</p>
        )}

        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isOwnMessage
              ? `bg-blue-600 text-white ${grouped ? 'rounded-tr-md' : ''}`
              : `bg-gray-700 text-gray-100 ${grouped ? 'rounded-tl-md' : ''}`
          }`}
        >
          {message.type === 'code' ? (
            <CodeBlock content={message.content} language={message.language ?? ''} />
          ) : (
            <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
          )}
        </div>

        {showMeta && (
          <p className="text-xs text-gray-600 mt-0.5 mx-1">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
}
