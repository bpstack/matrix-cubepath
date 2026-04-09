import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export interface TopScoredIdea {
  id: number;
  title: string;
  status: string;
  totalScore: number;
}

export interface IdeaFunnel {
  pending: number;
  evaluating: number;
  approved: number;
  promoted: number;
  rejected: number;
}

export function useTopScoredIdeas() {
  return useQuery<TopScoredIdea[]>({
    queryKey: ['ideas', 'top-scored'],
    queryFn: () => apiFetch('/ideas/top-scored'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useIdeaFunnel() {
  return useQuery<IdeaFunnel>({
    queryKey: ['ideas', 'funnel'],
    queryFn: () => apiFetch('/ideas/funnel'),
    staleTime: 2 * 60 * 1000,
  });
}
