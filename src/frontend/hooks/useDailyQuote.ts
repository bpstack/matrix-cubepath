import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface DailyQuote {
  quote: string;
  author: string;
}

const FALLBACK_QUOTES: DailyQuote[] = [
  { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { quote: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
];

function getTodayKey(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getFallbackQuote(): DailyQuote {
  const dayOfYear = Math.floor(Date.now() / 86400000);
  return FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length];
}

export function useDailyQuote() {
  const [quote, setQuote] = useState<DailyQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuote = async (forceRefresh = false) => {
    // Skip cache on refresh
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem('dailyQuote');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.date === getTodayKey()) {
            setQuote({ quote: parsed.quote, author: parsed.author });
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Always try to fetch fresh quote from backend first
    try {
      const data = await apiFetch<DailyQuote>(`/external/daily-quote${forceRefresh ? '?refresh=1' : ''}`);
      setQuote(data);
      setIsLoading(false);

      // Cache in localStorage
      try {
        localStorage.setItem('dailyQuote', JSON.stringify({ ...data, date: getTodayKey() }));
      } catch {
        // Ignore storage errors
      }
      return;
    } catch {
      // Fall through to cache or fallback
    }

    // Use fallback
    const fallback = getFallbackQuote();
    setQuote(fallback);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuote(false);
  }, []);

  const refresh = () => {
    setIsLoading(true);
    localStorage.removeItem('dailyQuote');
    fetchQuote(true);
  };

  return { quote, isLoading, refresh };
}
