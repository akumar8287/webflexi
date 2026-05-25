'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Code2,
  LogOut,
  User,
  PlusCircle,
} from 'lucide-react';
import { User as UserType } from '@/types';
import { useAuthStore } from '@/lib/store';
import { useSessions, useMentors, useCreateSession } from '@/hooks/useSessions';
import DashboardStats from './DashboardStats';
import { formatDistanceToNow } from 'date-fns';

interface JuniorDashboardProps {
  user: UserType;
}

export default function JuniorDashboard({ user }: JuniorDashboardProps) {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'mentors'>('overview');

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Code2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">WebFlexi Solutions</h1>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/submissions/new"
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Submit Code</span>
              </Link>
              <Link
                href="/profile"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Edit Profile"
              >
                <User className="h-5 w-5" />
              </Link>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">Junior Developer</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}! 👋
          </h2>
          <p className="text-blue-100">
            Ready to learn and get help from expert developers?
          </p>
        </div>

        {/* Quick Stats */}
        <DashboardStats />

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <TabButton
                active={activeTab === 'overview'}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </TabButton>
              <TabButton
                active={activeTab === 'sessions'}
                onClick={() => setActiveTab('sessions')}
              >
                My Sessions
              </TabButton>
              <TabButton
                active={activeTab === 'mentors'}
                onClick={() => setActiveTab('mentors')}
              >
                Find Mentors
              </TabButton>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'sessions' && <SessionsTab />}
            {activeTab === 'mentors' && <MentorsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function OverviewTab() {
  const { data: sessions, isLoading } = useSessions();

  const recentSessions = sessions?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Welcome to WebFlexi</h3>
        <p className="text-gray-600 mb-6">
          Connect with experienced developers, get help with your code, and accelerate your learning journey.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-2">Getting Started</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Browse available mentors in the &quot;Find Mentors&quot; tab</li>
            <li>Click &quot;Request Session&quot; on a mentor&apos;s profile</li>
            <li>Wait for the mentor to accept your request</li>
            <li>Join the session when it&apos;s scheduled</li>
          </ol>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading activity...</div>
        ) : recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map((session: any) => (
              <ActivityItem
                key={session.id}
                title={`Session with ${session.senior?.firstName} ${session.senior?.lastName}`}
                time={formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                status={session.status}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent activity. Start by finding a mentor!
          </div>
        )}
      </div>
    </div>
  );
}

function SessionsTab() {
  const { data: sessions, isLoading } = useSessions();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Your Sessions</h3>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading sessions...</div>
      ) : sessions && sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session: any) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No sessions yet. Find a mentor to get started!
        </div>
      )}
    </div>
  );
}

function MentorsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const { data: mentors, isLoading } = useMentors(activeSearch);

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search mentors by skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading mentors...</div>
      ) : mentors && mentors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentors.map((mentor: any) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No mentors found. Try a different search.
        </div>
      )}
    </div>
  );
}

function ActivityItem({ title, time, status }: any) {
  const statusColors: any = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status}
      </span>
    </div>
  );
}

function SessionCard({ session }: any) {
  const statusColors: any = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    ACTIVE: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-900">Session</h4>
          <p className="text-sm text-gray-600">
            with {session.senior?.firstName} {session.senior?.lastName}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
          {session.status.toLowerCase()}
        </span>
      </div>
      <p className="text-sm text-gray-500">
        {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
      </p>
      {(session.status === 'SCHEDULED' || session.status === 'ACTIVE') && (
        <Link
          href={`/session/room/${session.id}`}
          className="mt-3 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          Join Session →
        </Link>
      )}
    </div>
  );
}

function MentorCard({ mentor }: any) {
  const createSessionMutation = useCreateSession();

  const handleRequestSession = () => {
    createSessionMutation.mutate({ seniorId: mentor.id });
  };

  return (
    <div className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {mentor.firstName?.charAt(0) || 'M'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {mentor.firstName} {mentor.lastName}
            </h4>
            <p className="text-sm text-gray-600">{mentor.experienceYears} years exp.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">⭐ {mentor.rating?.toFixed(1) || '0.0'}</p>
          <p className="text-xs text-gray-500">${mentor.hourlyRate}/hr</p>
        </div>
      </div>
      {mentor.bio && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{mentor.bio}</p>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {mentor.skills?.slice(0, 3).map((skill: string) => (
          <span
            key={skill}
            className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>
      <button
        onClick={handleRequestSession}
        disabled={createSessionMutation.isPending}
        className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {createSessionMutation.isPending ? 'Requesting...' : 'Request Session'}
      </button>
    </div>
  );
}
