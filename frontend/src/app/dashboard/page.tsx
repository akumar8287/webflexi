'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { UserRole } from '@/types';
import JuniorDashboard from '@/components/dashboard/JuniorDashboard';
import SeniorDashboard from '@/components/dashboard/SeniorDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    // Wait for store to hydrate from localStorage
    if (!_hasHydrated) return;

    // After hydration, check if user is authenticated
    if (!user || !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [_hasHydrated, user, isAuthenticated, router]);

  // Show loading while waiting for hydration
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show loading while redirecting
  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.role === UserRole.JUNIOR ? (
        <JuniorDashboard user={user} />
      ) : (
        <SeniorDashboard user={user} />
      )}
    </div>
  );
}
