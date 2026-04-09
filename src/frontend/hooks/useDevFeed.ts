import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export interface HnStory {
  id: number;
  title: string;
  url: string;
  domain: string;
  time: number;
  score: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  html_url: string;
  language: string;
}

export interface DevFeedData {
  hnStories: HnStory[];
  trendingRepos: GitHubRepo[];
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

const CACHE_KEY = 'devFeed';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(): { data: { hnStories: HnStory[]; trendingRepos: GitHubRepo[]; fetchedAt: string } | null } {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const fetchedAt = new Date(parsed.fetchedAt).getTime();
      if (Date.now() - fetchedAt < CACHE_TTL) {
        return { data: parsed };
      }
    }
  } catch {
    // Ignore
  }
  return { data: null };
}

function setCached(data: { hnStories: HnStory[]; trendingRepos: GitHubRepo[] }) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, fetchedAt: new Date().toISOString() }));
  } catch {
    // Ignore storage errors
  }
}

export function useDevFeed() {
  const [data, setData] = useState<DevFeedData>({
    hnStories: [],
    trendingRepos: [],
    lastUpdated: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first
      const cached = getCached();
      if (cached.data) {
        setData({
          hnStories: cached.data.hnStories,
          trendingRepos: cached.data.trendingRepos,
          lastUpdated: new Date(cached.data.fetchedAt),
          isLoading: false,
          error: null,
        });
        return; // Skip network fetch if cache is fresh
      }

      // Fetch from backend (which calls external APIs)
      try {
        const result = await apiFetch<{ hnStories: HnStory[]; trendingRepos: GitHubRepo[] }>('/external/dev-feed');

        setData({
          hnStories: result.hnStories || [],
          trendingRepos: result.trendingRepos || [],
          lastUpdated: new Date(),
          isLoading: false,
          error: null,
        });

        // Update cache
        if (result.hnStories?.length > 0 || result.trendingRepos?.length > 0) {
          setCached({ hnStories: result.hnStories, trendingRepos: result.trendingRepos });
        }
        return;
      } catch {
        // Fall through to cache or error state
      }

      // If fetch failed but we have any cached data (even stale), use it
      // Read directly from localStorage to bypass TTL check
      try {
        const staleCache = localStorage.getItem(CACHE_KEY);
        if (staleCache) {
          const parsed = JSON.parse(staleCache);
          setData({
            hnStories: parsed.hnStories || [],
            trendingRepos: parsed.trendingRepos || [],
            lastUpdated: new Date(parsed.fetchedAt),
            isLoading: false,
            error: null,
          });
          return;
        }
      } catch {
        // Ignore
      }

      setData((prev) => ({ ...prev, isLoading: false, error: 'Unable to load feed' }));
    };

    fetchData();
  }, []);

  return data;
}
