import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface Stats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  activePlans: number;
  pendingIdeas: number;
}

export function useStats() {
  return useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => apiFetch('/stats'),
  });
}
