'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useEndSession } from '@/hooks/useSessions';
import CodeEditor from '@/components/code-editor/CodeEditor';
import VideoCall from '@/components/video-call/VideoCall';
import Chat from '@/components/chat/Chat';
import { Code2, Video, MessageSquare, X } from 'lucide-react';

interface SessionRoomProps {
  sessionId: string;
}

export default function SessionRoom({ sessionId }: SessionRoomProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const endSessionMutation = useEndSession();
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'video'>('code');

  const handleLeaveSession = async () => {
    await endSessionMutation.mutateAsync(sessionId).catch(() => {});
    router.push('/dashboard');
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Code2 className="h-6 w-6 text-blue-500" />
            <div>
              <h1 className="text-white font-semibold">
                Session Room #{sessionId}
              </h1>
              <p className="text-sm text-gray-400">
                Live Coding Session
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Tab Switcher for Mobile */}
            <div className="lg:hidden flex space-x-2">
              <button
                onClick={() => setActiveTab('code')}
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === 'code'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Code2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`p-2 rounded-lg transition-colors ${
                  activeTab === 'video'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Video className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Toggle */}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              title="Toggle Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            {/* Leave Session */}
            <button
              onClick={handleLeaveSession}
              disabled={endSessionMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {endSessionMutation.isPending ? 'Leaving...' : 'Leave Session'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Code Editor (Desktop) / Switchable (Mobile) */}
        <div className={`flex-1 ${activeTab === 'code' || 'hidden lg:flex'} flex flex-col`}>
          <CodeEditor sessionId={sessionId} />
        </div>

        {/* Middle - Video Call (Desktop) / Switchable (Mobile) */}
        <div className={`lg:w-96 ${activeTab === 'video' || 'hidden lg:block'}`}>
          <VideoCall sessionId={sessionId} userId={user?.id || ''} />
        </div>

        {/* Right Side - Chat */}
        {isChatOpen && (
          <div className="w-80 hidden lg:block border-l border-gray-700">
            <Chat sessionId={sessionId} />
          </div>
        )}
      </div>

      {/* Mobile Chat Overlay */}
      {isChatOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-gray-800 w-full h-2/3 rounded-t-2xl">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-semibold">Chat</h3>
              <button onClick={() => setIsChatOpen(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <Chat sessionId={sessionId} />
          </div>
        </div>
      )}
    </div>
  );
}
