import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TARGET_FILES = ['roadmap.md', 'todo.md', 'readme.md', 'ROADMAP.md', 'TODO.md', 'README.md'];

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'out',
  'coverage',
  '.cache',
  '.vite',
  '__pycache__',
  'target',
  'vendor',
  '.turbo',
  '.output',
]);

const LANG_MAP: Record<string, { name: string; color: string }> = {
  '.ts': { name: 'TypeScript', color: '#3178c6' },
  '.tsx': { name: 'TypeScript', color: '#3178c6' },
  '.js': { name: 'JavaScript', color: '#f1e05a' },
  '.jsx': { name: 'JavaScript', color: '#f1e05a' },
  '.py': { name: 'Python', color: '#3572a5' },
  '.rs': { name: 'Rust', color: '#dea584' },
  '.go': { name: 'Go', color: '#00add8' },
  '.java': { name: 'Java', color: '#b07219' },
  '.kt': { name: 'Kotlin', color: '#a97bff' },
  '.cs': { name: 'C#', color: '#178600' },
  '.cpp': { name: 'C++', color: '#f34b7d' },
  '.c': { name: 'C', color: '#555555' },
  '.rb': { name: 'Ruby', color: '#701516' },
  '.php': { name: 'PHP', color: '#4f5d95' },
  '.swift': { name: 'Swift', color: '#f05138' },
  '.vue': { name: 'Vue', color: '#41b883' },
  '.svelte': { name: 'Svelte', color: '#ff3e00' },
  '.html': { name: 'HTML', color: '#e34c26' },
  '.css': { name: 'CSS', color: '#563d7c' },
  '.scss': { name: 'SCSS', color: '#c6538c' },
  '.json': { name: 'JSON', color: '#292929' },
  '.yaml': { name: 'YAML', color: '#cb171e' },
  '.yml': { name: 'YAML', color: '#cb171e' },
  '.md': { name: 'Markdown', color: '#083fa1' },
  '.sql': { name: 'SQL', color: '#e38c00' },
  '.sh': { name: 'Shell', color: '#89e051' },
  '.dart': { name: 'Dart', color: '#00b4ab' },
  '.lua': { name: 'Lua', color: '#000080' },
  '.zig': { name: 'Zig', color: '#ec915c' },
};

export interface FileScanResult {
  file: string;
  type: 'roadmap' | 'plan' | 'todo' | 'readme' | 'changelog';
  exists: boolean;
  status?: string;
  totalPhases?: number;
  completedPhases?: number;
  lineCount?: number;
}

export interface ScanResult {
  roadmap: FileScanResult;
  todo: FileScanResult;
  readme: FileScanResult;
}

export interface TechStats {
  totalLines: number;
  languages: { name: string; color: string; lines: number; percent: number }[];
  hasTests: boolean;
  hasCiCd: boolean;
  dependencies: number;
  lastCommit: { message: string; date: string } | null;
  gitBranch: string | null;
  gitDirty: boolean;
}

/** Scan markdown files for project documentation status */
export function scanProject(projectPath: string): ScanResult {
  const result: ScanResult = {
    roadmap: { file: 'roadmap.md', type: 'roadmap', exists: false },
    todo: { file: 'todo.md', type: 'todo', exists: false },
    readme: { file: 'readme.md', type: 'readme', exists: false },
  };

  if (!fs.existsSync(projectPath)) {
    return result;
  }

  // Scan each target file
  for (const filename of TARGET_FILES) {
    const lowerName = filename.toLowerCase();
    let filePath = path.join(projectPath, filename);

    // Skip if already processed
    const type = getFileType(lowerName);
    if (!type || result[type].exists) continue;

    // Try to find file (including recursive search for todo)
    if (!fs.existsSync(filePath)) {
      if (lowerName === 'todo.md') {
        const found = findFileRecursive(projectPath, 'todo.md');
        if (!found) continue;
        filePath = found;
      } else {
        continue;
      }
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lineCount = content.split('\n').length;
    const scanResult = scanMarkdownFile(content, type);

    result[type] = {
      file: filename,
      type,
      exists: true,
      lineCount,
      ...scanResult,
    };
  }

  return result;
}

function getFileType(filename: string): 'roadmap' | 'todo' | 'readme' | null {
  if (filename.includes('roadmap')) return 'roadmap';
  if (filename.includes('todo')) return 'todo';
  if (filename.includes('readme')) return 'readme';
  return null;
}

function scanMarkdownFile(content: string, type: string): Record<string, unknown> {
  const lines = content.split('\n');

  if (type === 'roadmap') {
    // Count phases/etapas (## headers or checkboxes)
    let totalPhases = 0;
    let completedPhases = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      // Count ## headers as phases
      if (/^#{2}\s+/.test(trimmed)) {
        totalPhases++;
        if (/✅/.test(trimmed)) completedPhases++;
      }
      // Count checkboxes as phases too
      if (/^[-*]\s+\[x\]/i.test(trimmed)) {
        totalPhases++;
        completedPhases++;
      } else if (/^[-*]\s+\[ \]/.test(trimmed)) {
        totalPhases++;
      }
    }

    return { totalPhases, completedPhases };
  }

  if (type === 'todo') {
    // Check if has content (non-empty, non-comment lines)
    const hasContent = lines.some((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('#');
    });

    return { hasContent };
  }

  return {};
}

/** Collect technical stats from filesystem */
export function collectTechStats(projectPath: string): TechStats {
  const lineCounts: Record<string, number> = {};
  let totalLines = 0;

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (LANG_MAP[ext]) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n').length;
            lineCounts[ext] = (lineCounts[ext] || 0) + lines;
            totalLines += lines;
          } catch {
            // skip unreadable files
          }
        }
      }
    }
  }

  walk(projectPath);

  const languages = Object.entries(lineCounts)
    .map(([ext, lines]) => ({
      name: LANG_MAP[ext].name,
      color: LANG_MAP[ext].color,
      lines,
      percent: totalLines > 0 ? Math.round((lines / totalLines) * 100) : 0,
    }))
    .sort((a, b) => b.lines - a.lines);

  // Merge duplicates (e.g. .ts and .tsx both = TypeScript)
  const merged: typeof languages = [];
  for (const lang of languages) {
    const existing = merged.find((l) => l.name === lang.name);
    if (existing) {
      existing.lines += lang.lines;
      existing.percent = totalLines > 0 ? Math.round((existing.lines / totalLines) * 100) : 0;
    } else {
      merged.push({ ...lang });
    }
  }
  merged.sort((a, b) => b.lines - a.lines);

  // Detect tests - comprehensive check
  const hasTests = detectTests(projectPath);

  // Detect CI/CD
  const hasCiCd = checkExists(projectPath, [
    '.github/workflows',
    '.gitlab-ci.yml',
    '.circleci',
    'Jenkinsfile',
    '.travis.yml',
    'azure-pipelines.yml',
  ]);

  // Count dependencies
  const dependencies = countDependencies(projectPath);

  // Git info
  const lastCommit = getLastCommit(projectPath);
  const gitBranch = getGitBranch(projectPath);
  const gitDirty = isGitDirty(projectPath);

  return {
    totalLines,
    languages: merged,
    hasTests,
    hasCiCd,
    dependencies,
    lastCommit,
    gitBranch,
    gitDirty,
  };
}

function checkExists(base: string, paths: string[]): boolean {
  return paths.some((p) => fs.existsSync(path.join(base, p)));
}

function findFileRecursive(startDir: string, filename: string): string | null {
  const entries = fs.readdirSync(startDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;

      const result = findFileRecursive(fullPath, filename);
      if (result) return result;
    }

    if (entry.isFile() && entry.name === filename) {
      return fullPath;
    }
  }

  return null;
}

function countDependencies(projectPath: string): number {
  let count = 0;

  const pkgPath = findFileRecursive(projectPath, 'package.json');
  if (pkgPath) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      count += Object.keys(pkg.dependencies || {}).length;
      count += Object.keys(pkg.devDependencies || {}).length;
    } catch {
      /* skip */
    }
  }

  const reqPath = findFileRecursive(projectPath, 'requirements.txt');
  if (reqPath && fs.existsSync(reqPath)) {
    try {
      const lines = fs
        .readFileSync(reqPath, 'utf-8')
        .split('\n')
        .filter((l) => l.trim() && !l.startsWith('#'));
      count += lines.length;
    } catch {
      /* skip */
    }
  }
  // Cargo.toml
  const cargoPath = findFileRecursive(projectPath, 'Cargo.toml');
  if (cargoPath && fs.existsSync(cargoPath)) {
    try {
      const content = fs.readFileSync(cargoPath, 'utf-8');
      const depSection = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
      if (depSection) {
        count += depSection[1].split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
      }
    } catch {
      /* skip */
    }
  }
  return count;
}

function getLastCommit(projectPath: string): { message: string; date: string } | null {
  try {
    const result = execSync('git log -1 --format="%s|||%ai"', { cwd: projectPath, encoding: 'utf-8', timeout: 5000 });
    const [message, date] = result.trim().split('|||');
    return { message, date };
  } catch {
    return null;
  }
}

function getGitBranch(projectPath: string): string | null {
  try {
    return execSync('git branch --show-current', { cwd: projectPath, encoding: 'utf-8', timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

function isGitDirty(projectPath: string): boolean {
  try {
    const result = execSync('git status --porcelain', { cwd: projectPath, encoding: 'utf-8', timeout: 5000 });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/** Comprehensive test detection for professional projects */
function detectTests(projectPath: string): boolean {
  const testDirs = [
    'test',
    'tests',
    '__tests__',
    'spec',
    'specs',
    'testing',
    'e2e',
    'integration',
    'cypress',
    'playwright',
    'mocks',
  ];
  const testExtensions = ['.test.', '.spec.'];
  const testFiles = [
    'vitest.config.ts',
    'vitest.config.js',
    'vitest.config.mts',
    'jest.config.js',
    'jest.config.ts',
    'jest.config.mjs',
    'jest.setup.js',
    'karma.conf.js',
    'cypress.config.ts',
    'cypress.config.js',
    'playwright.config.ts',
    'playwright.config.js',
    '.mocharc.json',
    'mocha.opts',
    'pytest.ini',
    'conftest.py',
    'setup.cfg',
    'pyproject.toml',
  ];
  const testPatterns = [
    'coverage',
    'nyc.config.js',
    '.nycrc',
    '.nycrc.json',
    'vitest.workspace.ts',
    'jest.workspace.js',
  ];

  function walk(dir: string, depth = 0): boolean {
    if (depth > 4) return false;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.name === 'node_modules') continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (testDirs.includes(entry.name.toLowerCase())) {
          return true;
        }
        if (walk(fullPath, depth + 1)) {
          return true;
        }
      }

      if (entry.isFile()) {
        const name = entry.name.toLowerCase();
        if (testExtensions.some((ext) => name.includes(ext))) {
          return true;
        }
        if (testFiles.includes(entry.name)) {
          return true;
        }
        if (testPatterns.includes(name)) {
          return true;
        }
      }
    }
    return false;
  }

  return walk(projectPath);
}
