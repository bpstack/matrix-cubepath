import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { toast } from '../lib/toast';

export interface Plan {
  id: number;
  objectiveId: number;
  title: string;
  description: string | null;
  status: string;
  sortOrder: number;
  deadline: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export function usePlans(objectiveId?: number) {
  const params = objectiveId ? `?objective_id=${objectiveId}` : '';
  return useQuery<Plan[]>({
    queryKey: ['plans', objectiveId],
    queryFn: () => apiFetch(`/plans${params}`),
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { objectiveId: number; title: string; description?: string; deadline?: string }) =>
      apiFetch('/plans', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.ok('toastCreated');
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
    onError: () => toast.fail(),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      title?: string;
      description?: string;
      status?: string;
      deadline?: string;
    }) => apiFetch(`/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
    onError: () => toast.fail(),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, newParentId }: { id: number; action?: string; newParentId?: number }) =>
      apiFetch(`/plans/${id}`, { method: 'DELETE', body: JSON.stringify({ action, newParentId }) }),
    onSuccess: () => {
      toast.ok('toastDeleted');
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
    },
    onError: () => toast.fail(),
  });
}
