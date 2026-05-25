'use client';

import { useSessionStats } from '@/hooks/useSessions';
import { Clock, Video, CheckCircle, User } from 'lucide-react';

export default function DashboardStats() {
  const { data: stats, isLoading } = useSessionStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 p-6 rounded-xl animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={<Clock className="h-6 w-6 text-yellow-600" />}
        title="Pending Sessions"
        value={stats?.pending || 0}
        bgColor="bg-yellow-50"
      />
      <StatCard
        icon={<Video className="h-6 w-6 text-green-600" />}
        title="Active Sessions"
        value={stats?.active || 0}
        bgColor="bg-green-50"
      />
      <StatCard
        icon={<CheckCircle className="h-6 w-6 text-blue-600" />}
        title="Completed"
        value={stats?.completed || 0}
        bgColor="bg-blue-50"
      />
      <StatCard
        icon={<User className="h-6 w-6 text-purple-600" />}
        title="Total Sessions"
        value={stats?.total || 0}
        bgColor="bg-purple-50"
      />
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
