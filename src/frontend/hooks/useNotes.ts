import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export function useNoteDates() {
  return useQuery<string[]>({
    queryKey: ['notes'],
    queryFn: () => apiFetch<string[]>('/notes'),
  });
}

export function useNote(date: string) {
  return useQuery<{ content: string }>({
    queryKey: ['notes', date],
    queryFn: () => apiFetch<{ content: string }>(`/notes/${date}`),
    enabled: Boolean(date),
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, content }: { date: string; content: string }) =>
      apiFetch(`/notes/${date}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    onSuccess: (_data, { date }) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', date] });
    },
  });
}
