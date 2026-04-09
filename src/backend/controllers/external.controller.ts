import { Request, Response } from 'express';
import { logger } from '../lib/logger';

interface HnStory {
  id: number;
  title: string;
  url: string;
  domain: string;
  time: number;
  score: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  html_url: string;
  language: string;
}

interface Quote {
  quote: string;
  author: string;
}

// In-memory cache for the daily quote: one API call per day max
let cachedQuote: { data: Quote; fetchedAt: number } | null = null;
const QUOTE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

const FALLBACK_QUOTES = [
  { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { quote: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { quote: 'Stay hungry, stay foolish.', author: 'Steve Jobs' },
  { quote: "Code is like humor. When you have to explain it, it's bad.", author: 'Cory House' },
  { quote: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { quote: 'Experience is the name everyone gives to their mistakes.', author: 'Oscar Wilde' },
  { quote: 'The best error message is the one that never shows up.', author: 'Thomas Fuchs' },
  { quote: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
  { quote: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
  {
    quote:
      'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.',
    author: 'Martin Fowler',
  },
  { quote: "Programming isn't about what you know; it's about what you can figure out.", author: 'Chris Pine' },
  {
    quote: 'The most disastrous thing that you can ever learn is your first programming language.',
    author: 'Alan Kay',
  },
  {
    quote:
      "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code.",
    author: 'Dan Salomon',
  },
  { quote: 'Debugging is twice as hard as writing the code in the first place.', author: 'Brian Kernighan' },
  { quote: "You can't have great software without a great team.", author: 'Jim Rohns' },
  { quote: 'The computer was born to solve problems that did not exist before.', author: 'Bill Gates' },
  { quote: 'Technology is best when it brings people together.', author: 'Matt Mullenweg' },
  { quote: "It's not a bug - it's an undocumented feature.", author: 'Anonymous' },
  { quote: 'Before software can be reusable it first has to be usable.', author: 'Ralph Johnson' },
  { quote: 'The best way to predict the future is to invent it.', author: 'Alan Kay' },
  { quote: 'Progress is impossible without change.', author: 'George Bernard Shaw' },
  { quote: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt' },
  { quote: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { quote: 'Success is not final, failure is not fatal.', author: 'Winston Churchill' },
  { quote: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { quote: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { quote: "Everything you've ever wanted is on the other side of fear.", author: 'George Addair' },
  { quote: 'Dream big and dare to fail.', author: 'Norman Vaughan' },
  {
    quote: 'What you get by achieving your goals is not as important as what you become by achieving your goals.',
    author: 'Zig Ziglar',
  },
  { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
];

function getFallbackQuote(): Quote {
  const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[randomIndex];
}

async function fetchQuoteFromAPI(): Promise<Quote | null> {
  try {
    const response = await fetch('https://zenquotes.io/api/random', {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Array<{ q: string; a: string }>;
    if (!Array.isArray(data) || !data[0]?.q || !data[0]?.a) return null;
    // ZenQuotes returns "Too many requests" as quote text when rate-limited
    if (data[0].q.toLowerCase().includes('too many requests')) return null;
    return { quote: data[0].q, author: data[0].a };
  } catch {
    return null;
  }
}

export const externalController = {
  async getDailyQuote(req: Request, res: Response) {
    const forceRefresh = req.query.refresh === '1';
    // Return cached quote if still valid (unless force refresh)
    if (!forceRefresh && cachedQuote && Date.now() - cachedQuote.fetchedAt < QUOTE_CACHE_TTL) {
      return res.json(cachedQuote.data);
    }

    // Try external API
    const apiQuote = await fetchQuoteFromAPI();
    if (apiQuote) {
      cachedQuote = { data: apiQuote, fetchedAt: Date.now() };
      return res.json(apiQuote);
    }

    // Fallback to local quotes
    logger.warn('external', 'ZenQuotes API unavailable, using fallback');
    const fallback = getFallbackQuote();
    cachedQuote = { data: fallback, fetchedAt: Date.now() };
    res.json(fallback);
  },

  async getDevFeed(_req: Request, res: Response) {
    const result = {
      hnStories: [] as HnStory[],
      trendingRepos: [] as GitHubRepo[],
    };

    // Fetch HN stories
    try {
      const hnResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
        signal: AbortSignal.timeout(5000),
      });

      if (hnResponse.ok) {
        const ids: number[] = await hnResponse.json();
        const topIds = ids.slice(0, 10);

        const storyPromises = topIds.map((id) =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) }).then(
            (res) => res.json() as Promise<{ id: number; title: string; url?: string; time: number; score: number }>,
          ),
        );

        const stories = await Promise.allSettled(storyPromises);

        result.hnStories = stories
          .filter(
            (
              s,
            ): s is PromiseFulfilledResult<{ id: number; title: string; url?: string; time: number; score: number }> =>
              s.status === 'fulfilled' && Boolean(s.value?.title),
          )
          .map((s) => ({
            id: s.value.id,
            title: s.value.title,
            url: s.value.url || `https://news.ycombinator.com/item?id=${s.value.id}`,
            domain: s.value.url ? new URL(s.value.url).hostname.replace('www.', '') : 'news.ycombinator.com',
            time: s.value.time,
            score: s.value.score,
          }));
      }
    } catch {
      // HN failed, continue with empty
    }

    // Fetch GitHub trending
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const dateStr = lastWeek.toISOString().split('T')[0];

      const ghResponse = await fetch(
        `https://api.github.com/search/repositories?q=created:>${dateStr}&sort=stars&order=desc&per_page=10`,
        {
          signal: AbortSignal.timeout(5000),
          headers: { Accept: 'application/vnd.github.v3+json' },
        },
      );

      if (ghResponse.ok) {
        const json = (await ghResponse.json()) as { items?: GitHubRepo[] };
        result.trendingRepos = (json.items || []).slice(0, 10).map((r) => ({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          description: r.description || '',
          stargazers_count: r.stargazers_count,
          html_url: r.html_url,
          language: r.language || '',
        }));
      }
    } catch {
      // GitHub failed, continue with empty
    }

    res.json(result);
  },
};
