import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { toast } from '../lib/toast';

interface Mission {
  id: number;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export function useMission() {
  return useQuery<Mission[]>({
    queryKey: ['mission'],
    queryFn: () => apiFetch('/mission'),
  });
}

export function useCreateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      apiFetch('/mission', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.ok('toastCreated');
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
    onError: () => toast.fail(),
  });
}

export function useUpdateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; title?: string; description?: string; status?: string }) =>
      apiFetch(`/mission/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mission'] }),
    onError: () => toast.fail(),
  });
}

export function useDeleteMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: number; action?: string }) =>
      apiFetch(`/mission/${id}`, { method: 'DELETE', body: JSON.stringify({ action }) }),
    onSuccess: () => {
      toast.ok('toastDeleted');
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
    onError: () => toast.fail(),
  });
}
