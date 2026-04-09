import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface PasswordEntry {
  id: number;
  label: string;
  domain?: string;
  username?: string;
  category: string;
  favorite: number;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordEntryFull extends PasswordEntry {
  password: string;
  notes?: string;
}

export interface ParseResult {
  parsed: Array<{
    lineNumber: number;
    raw: string;
    label: string;
    domain?: string;
    username?: string;
    password: string;
    notes?: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  unmatched: Array<{
    lineNumber: number;
    raw: string;
    reason: string;
  }>;
  format: 'csv' | 'txt';
}

export function usePasswordStatus() {
  return useQuery<{ isSetup: boolean; isUnlocked: boolean }>({
    queryKey: ['passwords', 'status'],
    queryFn: () => apiFetch('/passwords/status'),
  });
}

export function usePasswords(search?: string, category?: string, enabled = true) {
  return useQuery<PasswordEntry[]>({
    queryKey: ['passwords', 'list', search, category],
    enabled,
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category && category !== 'all') params.set('category', category);
      return apiFetch(`/passwords?${params}`);
    },
  });
}

export function usePasswordById(id: number | null) {
  return useQuery<PasswordEntryFull>({
    queryKey: ['passwords', 'detail', id],
    queryFn: () => apiFetch(`/passwords/${id}`),
    enabled: id !== null,
  });
}

export function useSetupMaster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (masterPassword: string) =>
      apiFetch('/passwords/setup', { method: 'POST', body: JSON.stringify({ masterPassword }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passwords', 'status'] }),
  });
}

export function useUnlockVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (masterPassword: string) =>
      apiFetch('/passwords/unlock', { method: 'POST', body: JSON.stringify({ masterPassword }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passwords', 'status'] });
      qc.invalidateQueries({ queryKey: ['passwords', 'list'] });
    },
  });
}

export function useLockVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/passwords/lock', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passwords', 'status'] });
      qc.invalidateQueries({ queryKey: ['passwords', 'list'] });
    },
  });
}

export function useCreatePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      label: string;
      domain?: string;
      username?: string;
      password: string;
      category?: string;
      notes?: string;
    }) => apiFetch('/passwords', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passwords', 'list'] }),
  });
}

export function useUpdatePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: number } & Partial<{
      label: string;
      domain: string;
      username: string;
      password: string;
      category: string;
      notes: string;
    }>) => apiFetch(`/passwords/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passwords', 'list'] }),
  });
}

export function useDeletePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/passwords/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passwords', 'list'] }),
  });
}

export function useBulkDeletePasswords() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) =>
      apiFetch('/passwords/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passwords', 'list'] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/passwords/${id}/favorite`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['passwords', 'list'] }),
  });
}

export function useParseImport() {
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch('/passwords/import/parse', { method: 'POST', body: JSON.stringify({ content }) }),
  });
}

export function useConfirmImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      entries: Array<{
        label: string;
        domain?: string;
        username?: string;
        password: string;
        category?: string;
      }>,
    ) => apiFetch('/passwords/import/confirm', { method: 'POST', body: JSON.stringify({ entries }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passwords', 'list'] });
    },
  });
}

export function useChangeMasterPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiFetch('/passwords/change-master', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passwords', 'status'] });
      qc.invalidateQueries({ queryKey: ['passwords', 'list'] });
    },
  });
}
