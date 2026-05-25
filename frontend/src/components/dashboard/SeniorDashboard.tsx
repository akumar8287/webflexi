'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Code2,
  Video,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  LogOut,
  TrendingUp,
  Calendar,
  User,
} from 'lucide-react';
import { User as UserType } from '@/types';
import { useAuthStore } from '@/lib/store';
import { useSessionStats, useEarnings, useMentorRequests, useAcceptSession, useRejectSession, useSessions } from '@/hooks/useSessions';
import { formatDistanceToNow } from 'date-fns';

interface SeniorDashboardProps {
  user: UserType;
}

export default function SeniorDashboard({ user }: SeniorDashboardProps) {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'earnings'>('overview');

  const { data: stats } = useSessionStats();
  const { data: earnings } = useEarnings();

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
              <Code2 className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">WebFlexi Solutions</h1>
            </div>

            <div className="flex items-center space-x-3">
              <div className="px-3 py-2 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  💰 ${user.hourlyRate || 50}/hr
                </p>
              </div>
              <Link
                href="/profile"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                title="Edit Profile"
              >
                <User className="h-5 w-5" />
              </Link>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">Senior Mentor</p>
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
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user.firstName}! 🎯
          </h2>
          <p className="text-green-100">
            Ready to help developers level up their skills?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Clock className="h-6 w-6 text-yellow-600" />}
            title="Pending Requests"
            value={stats?.pending || 0}
            bgColor="bg-yellow-50"
          />
          <StatCard
            icon={<Video className="h-6 w-6 text-blue-600" />}
            title="Active Sessions"
            value={stats?.active || 0}
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            title="Completed"
            value={stats?.completed || 0}
            bgColor="bg-green-50"
          />
          <StatCard
            icon={<DollarSign className="h-6 w-6 text-purple-600" />}
            title="This Month"
            value={`$${earnings?.thisMonth || 0}`}
            bgColor="bg-purple-50"
          />
        </div>

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
                Sessions
              </TabButton>
              <TabButton
                active={activeTab === 'earnings'}
                onClick={() => setActiveTab('earnings')}
              >
                Earnings
              </TabButton>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'sessions' && <SessionsTab />}
            {activeTab === 'earnings' && <EarningsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, title, value, bgColor }: any) {
  return (
    <div className={`${bgColor} p-6 rounded-xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-white rounded-lg">{icon}</div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <p className="text-sm text-gray-600 font-medium">{title}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
        active
          ? 'border-green-600 text-green-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function OverviewTab() {
  const { data: requests, isLoading } = useMentorRequests();
  const { data: earnings } = useEarnings();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Requests</h3>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading requests...</div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((request: any) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No pending requests at the moment
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Total Earnings</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">${earnings?.total || 0}</p>
          <p className="text-sm text-gray-600">From {earnings?.sessions || 0} completed sessions</p>
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-sm text-gray-600">
              This Month: <span className="font-semibold text-green-600">${earnings?.thisMonth || 0}</span>
            </p>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Availability</h3>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">Next 7 days</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Monday</span>
              <span className="text-green-600 font-medium">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tuesday</span>
              <span className="text-green-600 font-medium">Available</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Wednesday</span>
              <span className="text-green-600 font-medium">Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionsTab() {
  const { data: sessions, isLoading } = useSessions();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Upcoming & Recent Sessions</h3>

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
          No sessions yet
        </div>
      )}
    </div>
  );
}

function EarningsTab() {
  const { data: earnings } = useEarnings();

  const avgPerSession = earnings?.sessions && earnings?.sessions > 0
    ? Math.round(earnings.total / earnings.sessions)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-green-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">This Month</p>
          <p className="text-3xl font-bold text-gray-900">${earnings?.thisMonth || 0}</p>
          <p className="text-sm text-gray-600 mt-2">Current month earnings</p>
        </div>
        <div className="p-6 bg-blue-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-gray-900">${earnings?.total || 0}</p>
          <p className="text-sm text-gray-600 mt-2">{earnings?.sessions || 0} sessions completed</p>
        </div>
        <div className="p-6 bg-purple-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Avg. Per Session</p>
          <p className="text-3xl font-bold text-gray-900">${avgPerSession}</p>
          <p className="text-sm text-gray-600 mt-2">Average earnings</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="text-center py-8 text-gray-500">
          Transaction history coming soon
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request }: any) {
  const acceptMutation = useAcceptSession();
  const rejectMutation = useRejectSession();

  const handleAccept = () => {
    acceptMutation.mutate(request.id);
  };

  const handleReject = () => {
    rejectMutation.mutate(request.id);
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">Session Request</h4>
          <p className="text-sm text-gray-600">
            from {request.junior?.firstName} {request.junior?.lastName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending
        </span>
      </div>
      <div className="flex items-center justify-between">
        {request.junior?.skills && request.junior.skills.length > 0 && (
          <div className="flex gap-1">
            {request.junior.skills.slice(0, 2).map((skill: string) => (
              <span key={skill} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {skill}
              </span>
            ))}
          </div>
        )}
        <div className="space-x-2">
          <button
            onClick={handleReject}
            disabled={rejectMutation.isPending}
            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {rejectMutation.isPending ? 'Rejecting...' : 'Decline'}
          </button>
          <button
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
            className="text-sm bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
          </button>
        </div>
      </div>
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
            with {session.junior?.firstName} {session.junior?.lastName}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
          {session.status.toLowerCase()}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
      </p>
      {(session.status === 'SCHEDULED' || session.status === 'ACTIVE') && (
        <Link
          href={`/session/room/${session.id}`}
          className="inline-block text-green-600 hover:text-green-700 font-medium text-sm"
        >
          Join Session →
        </Link>
      )}
    </div>
  );
}
