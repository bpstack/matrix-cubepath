import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { toast } from '../lib/toast';

export interface Objective {
  id: number;
  missionId: number;
  title: string;
  description: string | null;
  status: string;
  sortOrder: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export function useObjectives(missionId?: number) {
  const params = missionId ? `?mission_id=${missionId}` : '';
  return useQuery<Objective[]>({
    queryKey: ['objectives', missionId],
    queryFn: () => apiFetch(`/objectives${params}`),
  });
}

export function useCreateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { missionId: number; title: string; description?: string }) =>
      apiFetch('/objectives', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.ok('toastCreated');
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
    onError: () => toast.fail(),
  });
}

export function useUpdateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; title?: string; description?: string; status?: string }) =>
      apiFetch(`/objectives/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
    onError: () => toast.fail(),
  });
}

export function useDeleteObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, newParentId }: { id: number; action?: string; newParentId?: number }) =>
      apiFetch(`/objectives/${id}`, { method: 'DELETE', body: JSON.stringify({ action, newParentId }) }),
    onSuccess: () => {
      toast.ok('toastDeleted');
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
    onError: () => toast.fail(),
  });
}
