import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface DocFolder {
  id: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocFile {
  id: number;
  folderId: number;
  name: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocFileWithContent extends DocFile {
  content: string;
}

export interface DocsTree {
  folders: DocFolder[];
  files: DocFile[];
}

export function useDocsTree() {
  return useQuery<DocsTree>({
    queryKey: ['docs', 'tree'],
    queryFn: () => apiFetch<DocsTree>('/docs/tree'),
  });
}

export function useDocFile(id: number | null) {
  return useQuery<DocFileWithContent>({
    queryKey: ['docs', 'file', id],
    queryFn: () => apiFetch<DocFileWithContent>(`/docs/files/${id}`),
    enabled: id !== null,
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; parentId?: number }) =>
      apiFetch<DocFolder>('/docs/folders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'tree'] }),
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      apiFetch<DocFolder>(`/docs/folders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'tree'] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/docs/folders/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'tree'] }),
  });
}

export function useCreateFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; folderId: number }) =>
      apiFetch<DocFileWithContent>('/docs/files', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'tree'] }),
  });
}

export function useUpdateFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; content?: string; sortOrder?: number }) =>
      apiFetch<DocFileWithContent>(`/docs/files/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, variables) => {
      // Invalidate tree when renaming or reordering — content changes don't affect the tree
      if (variables.name !== undefined || variables.sortOrder !== undefined) {
        qc.invalidateQueries({ queryKey: ['docs', 'tree'] });
      }
      qc.invalidateQueries({ queryKey: ['docs', 'file', variables.id] });
    },
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/docs/files/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'tree'] }),
  });
}

export function useSearchDocs(q: string) {
  return useQuery<DocFile[]>({
    queryKey: ['docs', 'search', q],
    queryFn: () => apiFetch<DocFile[]>(`/docs/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
  });
}

export function useUpdateFolderSort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sortOrder }: { id: number; sortOrder: number }) =>
      apiFetch<DocFolder>(`/docs/folders/${id}/sort`, {
        method: 'PATCH',
        body: JSON.stringify({ sortOrder }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['docs', 'tree'] }),
  });
}
