import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await api.get('/sessions/my-sessions');
      return response.data.data;
    },
  });
}

export function useSessionStats() {
  return useQuery({
    queryKey: ['session-stats'],
    queryFn: async () => {
      const response = await api.get('/sessions/my-stats');
      return response.data.data;
    },
  });
}

export function useMentors(search?: string) {
  return useQuery({
    queryKey: ['mentors', search],
    queryFn: async () => {
      const response = await api.get('/sessions/mentors', {
        params: { search },
      });
      return response.data.data;
    },
  });
}

export function useEarnings() {
  return useQuery({
    queryKey: ['earnings'],
    queryFn: async () => {
      const response = await api.get('/sessions/my-earnings');
      return response.data.data;
    },
  });
}

export function useMentorRequests() {
  return useQuery({
    queryKey: ['mentor-requests'],
    queryFn: async () => {
      const response = await api.get('/sessions/my-requests');
      return response.data.data;
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { seniorId: string; scheduledAt?: string; price?: number }) => {
      const response = await api.post('/sessions', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      toast.success('Session request sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create session');
    },
  });
}

export function useAcceptSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post(`/sessions/${sessionId}/accept`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      toast.success('Session accepted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to accept session');
    },
  });
}

export function useRejectSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post(`/sessions/${sessionId}/reject`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      toast.success('Session rejected successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to reject session');
    },
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post(`/sessions/${sessionId}/start`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to start session');
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await api.post(`/sessions/${sessionId}/end`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-stats'] });
      toast.success('Session ended');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to end session');
    },
  });
}
