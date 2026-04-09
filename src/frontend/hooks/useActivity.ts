import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface ActivityEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  description: string;
  createdAt: string;
}

export function useActivity(limit = 15) {
  return useQuery<ActivityEntry[]>({
    queryKey: ['activity', limit],
    queryFn: () => apiFetch(`/activity?limit=${limit}`),
  });
}
