'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useEndSession } from '@/hooks/useSessions';
import CodeEditor from '@/components/code-editor/CodeEditor';
import VideoCall from '@/components/video-call/VideoCall';
import Chat from '@/components/chat/Chat';
import { SessionSocketProvider, useSessionSocket } from '@/context/SessionSocketContext';
import { Code2, Video, MessageSquare, X, Users, Wifi, WifiOff } from 'lucide-react';

interface SessionRoomProps {
  sessionId: string;
}

function SessionRoomInner({ sessionId }: SessionRoomProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const endSessionMutation = useEndSession();
  const { participants, isConnected } = useSessionSocket();

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'video'>('code');
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLeaveSession = async () => {
    await endSessionMutation.mutateAsync(sessionId).catch(() => {});
    router.push('/dashboard');
  };

  const handleChatToggle = () => {
    setIsChatOpen((v) => {
      if (!v) setUnreadCount(0); // clear unread when opening
      return !v;
    });
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Code2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-white font-semibold text-sm truncate">Session Room</h1>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-400" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-400" />
                )}
                <span className={`text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                  {isConnected ? 'Live' : 'Reconnecting…'}
                </span>
              </div>
            </div>

            {/* Participant avatars */}
            {participants.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gray-500" />
                <div className="flex -space-x-1">
                  {participants.slice(0, 4).map((p) => (
                    <div
                      key={p.socketId}
                      title={p.name}
                      className="w-6 h-6 rounded-full bg-blue-600 border-2 border-gray-800 flex items-center justify-center text-white text-xs font-medium"
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{participants.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile tab switcher */}
            <div className="lg:hidden flex gap-1">
              <button
                onClick={() => setActiveTab('code')}
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === 'code' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <Code2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <Video className="h-4 w-4" />
              </button>
            </div>

            {/* Chat toggle with unread badge */}
            <button
              onClick={handleChatToggle}
              className="relative p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              title="Toggle chat"
            >
              <MessageSquare className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Leave */}
            <button
              onClick={handleLeaveSession}
              disabled={endSessionMutation.isPending}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
            >
              {endSessionMutation.isPending ? 'Leaving…' : 'Leave'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Code Editor — desktop always shown, mobile switchable */}
        <div
          className={`flex-1 min-w-0 ${activeTab === 'code' ? 'flex' : 'hidden'} lg:flex flex-col`}
        >
          <CodeEditor sessionId={sessionId} />
        </div>

        {/* Video Call — desktop right panel, mobile switchable */}
        <div
          className={`${activeTab === 'video' ? 'flex' : 'hidden'} lg:flex lg:w-80 xl:w-96 flex-col border-l border-gray-700 flex-shrink-0`}
        >
          <VideoCall sessionId={sessionId} userId={user?.id ?? ''} />
        </div>

        {/* Chat — desktop right sidebar */}
        {isChatOpen && (
          <div className="w-72 hidden lg:flex flex-col border-l border-gray-700 flex-shrink-0">
            <Chat
              sessionId={sessionId}
              onUnreadChange={setUnreadCount}
              isVisible={isChatOpen}
            />
          </div>
        )}
      </div>

      {/* Mobile Chat Overlay */}
      {isChatOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-gray-800 w-full h-3/4 rounded-t-2xl flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
              <h3 className="text-white font-semibold text-sm">Chat</h3>
              <button onClick={() => setIsChatOpen(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <Chat
                sessionId={sessionId}
                onUnreadChange={setUnreadCount}
                isVisible={isChatOpen}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionRoom({ sessionId }: SessionRoomProps) {
  return (
    <SessionSocketProvider sessionId={sessionId}>
      <SessionRoomInner sessionId={sessionId} />
    </SessionSocketProvider>
  );
}
