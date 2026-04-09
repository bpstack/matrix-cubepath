import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { usePomodoroStore } from '../stores/pomodoro.store';
import { toast } from '../lib/toast';

export interface Task {
  id: number;
  planId: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  sortOrder: number;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useTasks(filters?: { planId?: number; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.planId) params.set('plan_id', String(filters.planId));
  if (filters?.status) params.set('status', filters.status);
  const qs = params.toString();
  return useQuery<Task[]>({
    queryKey: ['tasks', filters],
    queryFn: () => apiFetch(`/tasks${qs ? `?${qs}` : ''}`),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      planId: number;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      deadline?: string;
    }) => apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.ok('toastCreated');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
      qc.invalidateQueries({ queryKey: ['deadlines'] });
    },
    onError: () => toast.fail(),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      planId?: number;
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      deadline?: string | null;
      sortOrder?: number;
    }) => apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: (_result, variables) => {
      if (variables.status === 'done') {
        const { isFocusActive, incrementFocusTasks } = usePomodoroStore.getState();
        if (isFocusActive) incrementFocusTasks();
      }
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
      qc.invalidateQueries({ queryKey: ['deadlines'] });
      qc.invalidateQueries({ queryKey: ['activity', 'metrics'] });
    },
    onError: () => toast.fail(),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.ok('toastDeleted');
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['mission'] });
      qc.invalidateQueries({ queryKey: ['deadlines'] });
    },
    onError: () => toast.fail(),
  });
}
