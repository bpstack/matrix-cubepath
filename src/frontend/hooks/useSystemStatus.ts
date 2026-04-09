import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface RenderServiceStatus {
  name: string;
  url: string;
  status: 'online' | 'sleeping' | 'offline';
  responseTime?: number | null;
}

export interface DatabaseStatus {
  name: string;
  type: string;
  status: 'online' | 'offline';
}

export interface SystemStatusData {
  api: { status: 'online' };
  render: RenderServiceStatus[];
  databases: DatabaseStatus[];
  vaultLocked: boolean;
  checkedAt?: string;
}

export interface ExternalServices {
  render: { name: string; url: string }[];
  databases: { name: string; type: string; connectionString: string }[];
}

export function useSystemStatus() {
  return useQuery<SystemStatusData>({
    queryKey: ['system-status'],
    queryFn: () => apiFetch('/stats/system-status'),
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useWakeService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (url: string) =>
      apiFetch('/stats/wake-service', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['system-status'] }),
  });
}

export function useExternalServices() {
  return useQuery<ExternalServices>({
    queryKey: ['external-services'],
    queryFn: async () => {
      const res = await fetch('/api/settings/services', { credentials: 'same-origin' });
      // 401 means vault is locked — return empty services instead of redirecting to login
      if (res.status === 401) return { render: [], databases: [] };
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSetExternalServices() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExternalServices) =>
      apiFetch('/settings/services', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['external-services'] });
      // Force backend cache bypass so the new services appear immediately
      qc.fetchQuery({
        queryKey: ['system-status'],
        queryFn: () => apiFetch('/stats/system-status?refresh=1'),
        staleTime: 0,
      });
    },
  });
}
