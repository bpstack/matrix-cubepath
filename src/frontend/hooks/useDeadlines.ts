import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface DeadlineTask {
  id: number;
  title: string;
  deadline: string;
  status: string;
  priority: string;
  planId: number | null;
}

export interface DeadlineSummary {
  overdue: DeadlineTask[];
  dueToday: DeadlineTask[];
  dueSoon: DeadlineTask[];
  total: number;
}

async function fetchDeadlines(): Promise<DeadlineSummary> {
  return apiFetch<DeadlineSummary>('/tasks/deadlines');
}

export function useDeadlines(enabled = true) {
  return useQuery({
    queryKey: ['deadlines'],
    queryFn: fetchDeadlines,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
}
