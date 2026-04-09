import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { toast } from '../lib/toast';

interface ScanData {
  id: number;
  projectId: number;
  totalTasks: number;
  completedTasks: number;
  blockers: number;
  wipItems: number;
  progressPercent: number;
  rawData: string;
  scannedAt: string;
}

interface TechStats {
  totalLines: number;
  languages: { name: string; color: string; lines: number; percent: number }[];
  hasTests: boolean;
  hasCiCd: boolean;
  dependencies: number;
  lastCommit: { message: string; date: string } | null;
  gitBranch: string | null;
  gitDirty: boolean;
}

export interface Project {
  id: number;
  name: string;
  path: string | null;
  resolvedPath: string | null;
  description: string | null;
  url: string | null;
  status: string;
  tags: string[];
  techStats: TechStats | null;
  scan: ScanData | null;
  links?: { id: number; linkableType: string; linkableId: number }[];
  createdAt: string;
  updatedAt: string;
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiFetch('/projects'),
  });
}

export function useProject(id: number | null) {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: () => apiFetch(`/projects/${id}`),
    enabled: id !== null,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; path?: string; description?: string; url?: string; tags?: string[] }) =>
      apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.ok('toastCreated');
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.fail(),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      path?: string;
      description?: string;
      url?: string;
      status?: string;
      tags?: string[];
    }) => apiFetch(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: () => toast.fail(),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.ok('toastDeleted');
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => toast.fail(),
  });
}

export function useScanProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/projects/${id}/scan`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: () => toast.fail(),
  });
}

export function useSyncProjectGitHub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/projects/${id}/sync-github`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    onError: () => toast.fail(),
  });
}
