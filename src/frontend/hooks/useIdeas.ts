import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { toast } from '../lib/toast';

export interface Idea {
  id: number;
  title: string;
  description: string | null;
  status: string;
  targetType: string | null;
  targetId: number | null;
  projectId: number | null;
  promotedToType: string | null;
  promotedToId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaEvaluation {
  id: number;
  ideaId: number;
  alignmentScore: number;
  impactScore: number;
  costScore: number;
  riskScore: number;
  totalScore: number;
  reasoning: string | null;
  decision: string;
  decidedAt: string | null;
  createdAt: string;
}

export function useIdeas(status?: string) {
  const qs = status ? `?status=${status}` : '';
  return useQuery<Idea[]>({
    queryKey: ['ideas', status],
    queryFn: () => apiFetch(`/ideas${qs}`),
  });
}

export function useIdea(id: number | null) {
  return useQuery<Idea>({
    queryKey: ['ideas', id],
    queryFn: () => apiFetch(`/ideas/${id}`),
    enabled: id !== null,
  });
}

export function useCreateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      targetType?: string;
      targetId?: number;
      projectId?: number;
    }) => apiFetch('/ideas', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.ok('toastCreated');
      qc.invalidateQueries({ queryKey: ['ideas'] });
    },
    onError: () => toast.fail(),
  });
}

export function useUpdateIdea() {
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
      targetType?: string | null;
      targetId?: number | null;
      projectId?: number | null;
    }) => apiFetch(`/ideas/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ideas'] });
    },
    onError: () => toast.fail(),
  });
}

export function useDeleteIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/ideas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.ok('toastDeleted');
      qc.invalidateQueries({ queryKey: ['ideas'] });
    },
    onError: () => toast.fail(),
  });
}

export function useEvaluateIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      alignmentScore: number;
      impactScore: number;
      costScore: number;
      riskScore: number;
      reasoning?: string;
    }) => apiFetch(`/ideas/${id}/evaluate`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ideas'] });
      qc.invalidateQueries({ queryKey: ['evaluation'] });
    },
  });
}

export function useIdeaEvaluation(ideaId: number | null) {
  return useQuery<IdeaEvaluation | null>({
    queryKey: ['evaluation', ideaId],
    queryFn: () => apiFetch<IdeaEvaluation | null>(`/ideas/${ideaId}/evaluation`),
    enabled: ideaId !== null,
    retry: false,
  });
}

export function useDecideIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: 'approved' | 'rejected' }) =>
      apiFetch(`/ideas/${id}/decide`, { method: 'PATCH', body: JSON.stringify({ decision }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ideas'] });
      qc.invalidateQueries({ queryKey: ['evaluation'] });
    },
  });
}

export function usePromoteIdea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, parentId }: { id: number; type: string; parentId?: number }) =>
      apiFetch(`/ideas/${id}/promote`, { method: 'POST', body: JSON.stringify({ type, parentId }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ideas'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['objectives'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
