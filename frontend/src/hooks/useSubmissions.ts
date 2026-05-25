import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export function useMySubmissions() {
  return useQuery({
    queryKey: ['submissions', 'mine'],
    queryFn: async () => {
      const response = await api.get('/submissions/mine');
      return response.data.data;
    },
  });
}

export function useAllSubmissions(language?: string) {
  return useQuery({
    queryKey: ['submissions', 'all', language],
    queryFn: async () => {
      const response = await api.get('/submissions', { params: { language } });
      return response.data.data;
    },
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      language: string;
      framework?: string;
      codeContent: string;
      errorDescription?: string;
      expectedBehavior?: string;
      actualBehavior?: string;
      tags?: string[];
    }) => {
      const response = await api.post('/submissions', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('Code submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit code');
    },
  });
}
