'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import SessionRoom from '@/components/session/SessionRoom';
import { Loader2 } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = params?.id as string;

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <SessionRoom sessionId={sessionId} />;
}
