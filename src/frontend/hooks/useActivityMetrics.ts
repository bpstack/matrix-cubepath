import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface ActivityMetrics {
  streak: {
    current: number;
    longest: number;
    weekData: number[];
    tasksThisWeek: number;
    avgPerDay: number;
  };
  burndown: { day: string; remaining: number | null; completed: number | null }[];
  weeklyTrends: { day: string; completed: number | null; created: number | null }[];
  keyMetrics: {
    velocity: number;
    wip: number;
    throughput: number;
    cycleTimeDays: number | null;
  };
}

export function useActivityMetrics() {
  return useQuery<ActivityMetrics>({
    queryKey: ['activity', 'metrics'],
    queryFn: () => apiFetch('/activity/metrics'),
    staleTime: 30 * 1000,
    retry: 1,
  });
}
