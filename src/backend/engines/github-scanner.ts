import { ScanResult, TechStats } from './scanner';

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Swift: '#f05138',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Dart: '#00b4ab',
  Kotlin: '#a97bff',
  Lua: '#000080',
  Zig: '#ec915c',
};

interface GitHubFileContent {
  content: string;
}

interface GitHubRepoInfo {
  default_branch?: string;
}

interface GitHubCommit {
  commit?: {
    message?: string;
    author?: {
      date?: string;
    };
  };
}

interface GitHubTree {
  tree?: Array<{ path?: string }>;
}

export function normalizeGitHubRepo(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error('GitHub repository is required');

  const cleaned = raw.replace(/\.git$/i, '').replace(/^git@github\.com:/i, 'https://github.com/');

  const urlMatch = cleaned.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/i);
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2]}`;

  const shortMatch = cleaned.match(/^([^/]+)\/([^/]+)$/);
  if (shortMatch) return `${shortMatch[1]}/${shortMatch[2]}`;

  throw new Error('Invalid GitHub repository format');
}

export async function fetchGitHubUser(token: string): Promise<{ login: string }> {
  const user = await ghFetch<{ login: string }>(token, '/user');
  if (!user?.login) throw new Error('Invalid GitHub token');
  return user;
}

export async function syncFromGitHub(
  token: string | null,
  repoRef: string,
): Promise<{ normalizedRepo: string; scan: ScanResult; techStats: TechStats }> {
  const normalizedRepo = normalizeGitHubRepo(repoRef);
  const [owner, repo] = normalizedRepo.split('/');

  const [repoInfo, languages, commits, readme, roadmap, todo] = await Promise.all([
    ghFetch<GitHubRepoInfo>(token, `/repos/${owner}/${repo}`),
    ghFetch<Record<string, number>>(token, `/repos/${owner}/${repo}/languages`),
    ghFetch<GitHubCommit[]>(token, `/repos/${owner}/${repo}/commits?per_page=1`),
    ghFetch<GitHubFileContent>(token, `/repos/${owner}/${repo}/readme`, true),
    ghFetch<GitHubFileContent>(token, `/repos/${owner}/${repo}/contents/ROADMAP.md`, true),
    ghFetch<GitHubFileContent>(token, `/repos/${owner}/${repo}/contents/TODO.md`, true),
  ]);

  const branch = repoInfo?.default_branch || 'main';
  const tree = await ghFetch<GitHubTree>(token, `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, true);
  const paths = (tree?.tree || []).map((t) => t.path || '').filter(Boolean);

  const techStats: TechStats = {
    totalLines: languages ? Math.round(Object.values(languages).reduce((a, b) => a + b, 0) / 40) : 0,
    languages: languages ? mapGitHubLanguages(languages) : [],
    hasTests: paths.some(
      (p) => /^(tests?|__tests__|spec|e2e|cypress|playwright)\//i.test(p) || /\.(test|spec)\.[jt]sx?$/.test(p),
    ),
    hasCiCd: paths.some(
      (p) =>
        p.startsWith('.github/workflows/') ||
        p === '.gitlab-ci.yml' ||
        p.startsWith('.circleci/') ||
        p === 'Jenkinsfile',
    ),
    dependencies: await countGitHubDeps(token, owner, repo),
    lastCommit: commits?.[0]?.commit
      ? {
          message: (commits[0].commit.message || '').split('\n')[0],
          date: commits[0].commit.author?.date || new Date().toISOString(),
        }
      : null,
    gitBranch: branch,
    gitDirty: false,
  };

  const roadmapText = decodeBase64Content(roadmap?.content);
  const todoText = decodeBase64Content(todo?.content);
  const readmeText = decodeBase64Content(readme?.content);

  const roadmapStats = roadmapText ? getRoadmapProgress(roadmapText) : { totalPhases: 0, completedPhases: 0 };

  const scan: ScanResult = {
    roadmap: {
      file: 'ROADMAP.md',
      type: 'roadmap',
      exists: !!roadmapText,
      lineCount: roadmapText ? countLinesFromText(roadmapText) : undefined,
      ...roadmapStats,
    },
    todo: {
      file: 'TODO.md',
      type: 'todo',
      exists: !!todoText,
      lineCount: todoText ? countLinesFromText(todoText) : undefined,
    },
    readme: {
      file: 'README.md',
      type: 'readme',
      exists: !!readmeText,
      lineCount: readmeText ? countLinesFromText(readmeText) : undefined,
    },
  };

  return { normalizedRepo, scan, techStats };
}

async function countGitHubDeps(token: string | null, owner: string, repo: string): Promise<number> {
  let count = 0;

  const pkg = await ghFetch<GitHubFileContent>(token, `/repos/${owner}/${repo}/contents/package.json`, true);
  if (pkg?.content) {
    try {
      const parsed = JSON.parse(decodeBase64Content(pkg.content) || '{}');
      count += Object.keys(parsed.dependencies || {}).length;
      count += Object.keys(parsed.devDependencies || {}).length;
    } catch {
      // ignore malformed package.json
    }
  }

  const req = await ghFetch<GitHubFileContent>(token, `/repos/${owner}/${repo}/contents/requirements.txt`, true);
  if (req?.content) {
    const lines = (decodeBase64Content(req.content) || '')
      .split('\n')
      .filter((l) => l.trim() && !l.trim().startsWith('#'));
    count += lines.length;
  }

  const cargo = await ghFetch<GitHubFileContent>(token, `/repos/${owner}/${repo}/contents/Cargo.toml`, true);
  if (cargo?.content) {
    const content = decodeBase64Content(cargo.content) || '';
    const depSection = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
    if (depSection) {
      count += depSection[1].split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')).length;
    }
  }

  return count;
}

function mapGitHubLanguages(ghLangs: Record<string, number>): TechStats['languages'] {
  const total = Object.values(ghLangs).reduce((a, b) => a + b, 0);
  return Object.entries(ghLangs)
    .map(([name, bytes]) => ({
      name,
      color: LANG_COLORS[name] || '#888888',
      lines: Math.round(bytes / 40),
      percent: total > 0 ? Math.round((bytes / total) * 100) : 0,
    }))
    .sort((a, b) => b.lines - a.lines);
}

function decodeBase64Content(content?: string): string | null {
  if (!content) return null;
  return Buffer.from(content, 'base64').toString('utf-8');
}

function countLinesFromText(text: string): number {
  return text.split('\n').length;
}

function getRoadmapProgress(content: string): { totalPhases: number; completedPhases: number } {
  const lines = content.split('\n');
  let totalPhases = 0;
  let completedPhases = 0;

  // Count ## and ### headers as phases; ✅ marks completion
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{2,3}\s+/.test(trimmed)) {
      totalPhases++;
      if (/✅/.test(trimmed)) completedPhases++;
    }
  }

  // If no ✅ markers found, fall back to checkbox ratio
  if (totalPhases > 0 && completedPhases === 0) {
    let checked = 0;
    let total = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-*]\s+\[x\]/i.test(trimmed)) {
        checked++;
        total++;
      } else if (/^[-*]\s+\[ \]/.test(trimmed)) {
        total++;
      }
    }
    if (total > 0) {
      return { totalPhases: total, completedPhases: checked };
    }
  }

  return { totalPhases, completedPhases };
}

async function ghFetch<T>(token: string | null, apiPath: string, allow404 = false): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Matrix-App',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${apiPath}`, { headers });

  if (allow404 && res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API error (${res.status}): ${body || res.statusText}`);
  }

  return (await res.json()) as T;
}
