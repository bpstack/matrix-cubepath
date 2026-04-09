/**
 * Demo user seed — creates the demo account and fills their isolated DB
 * with realistic mock data so visitors can explore the app immediately.
 *
 * Safe to call multiple times: wipes and re-creates all demo data.
 * Activated at startup when DEMO_USER env var is set (default: "demo").
 */

import { Database as SqlJsDatabase } from 'sql.js';
import { createUser, userExists, deleteUserByEmail } from './auth-db';
import { closeUserDb, openUserDb, getUserSqlite } from './user-db';
import { logger } from '../lib/logger';

import enLocale from './seed-locales/en.json';
import esLocale from './seed-locales/es.json';
import type { SeedLocale } from './seed-data';
import {
  SEED_OBJECTIVES,
  SEED_PLANS,
  SEED_TASKS,
  SEED_PROJECTS,
  SEED_PROJECT_LINKS,
  SEED_IDEAS,
  SEED_EVALUATIONS,
  SEED_ACTIVITIES,
} from './seed-data';

// ── Docs content ─────────────────────────────────────────────────────────────

const DOC_SYSTEM_DESIGN = `# System Design

## Overview
Matrix is a self-hosted productivity platform built as a single-container web app. Each user gets their own isolated database — no shared state, no multi-tenant complexity.

## Stack
- **Backend**: Node.js + Express + Drizzle ORM
- **Frontend**: React 18 + Vite + TailwindCSS
- **Database**: SQLite — one instance per user
- **Auth**: scrypt + HMAC session tokens (httpOnly cookies)
- **Deploy**: Docker multi-stage on any VPS

## Data Model
\`\`\`
mission → objectives → plans → tasks
                             ↘ ideas (linked to objectives or plans)
projects (linked to missions/objectives/plans)
docs (folder tree + markdown files)
\`\`\`

## Per-User Isolation
Every authenticated request runs inside an AsyncLocalStorage context (\`userDbContext\`) that injects the user's DB. Repositories call \`getDb()\` which reads from this context — no user ID needed in queries.

## Request Flow
\`\`\`
Browser → Reverse Proxy → Express → requireAuth → userDbContext.run(db, next) → Router → Controller → Repository → SQLite
\`\`\``;

const DOC_API_REFERENCE = `# API Reference

All routes are prefixed with \`/api\`. Protected routes require an active session cookie.

## Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | \`/auth/register\` | Create account |
| POST | \`/auth/login\` | Start session |
| POST | \`/auth/logout\` | End session |

## Docs
| Method | Route | Description |
|--------|-------|-------------|
| GET | \`/docs/tree\` | Full folder + file tree (no content) |
| GET | \`/docs/search?q=\` | Search file names and content |
| POST | \`/docs/folders\` | Create folder |
| PATCH | \`/docs/folders/:id\` | Rename folder |
| DELETE | \`/docs/folders/:id\` | Delete folder (recursive) |
| GET | \`/docs/files/:id\` | Get file with content |
| POST | \`/docs/files\` | Create file |
| PATCH | \`/docs/files/:id\` | Update name / content / sort |
| DELETE | \`/docs/files/:id\` | Delete file |

## Tasks
| Method | Route | Description |
|--------|-------|-------------|
| GET | \`/tasks\` | All tasks (optional \`?planId=\`) |
| POST | \`/tasks\` | Create task |
| PATCH | \`/tasks/:id\` | Update task |
| DELETE | \`/tasks/:id\` | Delete task |`;

const DOC_DEPLOY = `# Deployment Guide

## Prerequisites
- A VPS with Docker installed
- Domain configured with a reverse proxy (Traefik, Nginx, Caddy)

## Environment Variables
\`\`\`env
SESSION_SECRET=<random 32+ char string>
NODE_ENV=production
PORT=3939
SECURE_COOKIE=true
DEMO_USER=demo
DEMO_PASSWORD=demo1234
ALLOW_REGISTRATION=false
\`\`\`

## Deploy Steps
1. Push to your main branch
2. Build the Docker image: \`docker build -t matrix .\`
3. Run with docker-compose
4. Migrations run on first request per user (idempotent)

## Rollback
Keep previous image tags and redeploy the last known-good version.`;

const DOC_GIT_WORKFLOW = `# Git Workflow

## Branches
- \`main\` — production branch
- \`feature/*\` — feature branches, merge via PR
- Never force-push to \`main\`

## Commit Convention
\`\`\`
type: short description

fix: correct session token validation
feat: add docs module
chore: update dependencies
docs: add API reference
\`\`\`

## CI Checks
Every PR runs:
1. \`pnpm typecheck\` — TypeScript strict mode
2. \`pnpm lint\` — ESLint
3. \`pnpm format:check\` — Prettier

All three must pass before merge.`;

const DOC_SPRINT_NOTES = `# Sprint Notes

## Week 3 — Final Push

### Done
- ✅ Auth: email login + password reset (server-log flow, no SMTP required)
- ✅ Docs module: folder tree + markdown editor with syntax highlighting
- ✅ Demo seed: full mock data across all modules
- ✅ CI/CD: GitHub Actions typecheck + auto-deploy

### In Progress
- 🔄 PWA: workbox-build schema bug blocking SW generation — tracking upstream fix
- 🔄 Mobile polish: settings page overflow on small screens

### Blocked
- ⛔ SMTP integration: waiting for server configuration

## Week 2 — Core Features

All core modules shipped:
- Tasks (Kanban + priorities + deadlines)
- Projects (scan + GitHub sync)
- Ideas (pipeline + evaluation)
- Overview (stats + activity + widgets)

## Week 1 — Foundation

- Per-user SQLite architecture ✓
- Docker multi-stage build ✓
- Deployment pipeline ✓
- HTTPS reverse proxy ✓`;

export const DEMO_USERNAME = process.env.DEMO_USER || 'demo';
export const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@demo.local';
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'demo1234';

export type SeedLang = 'en' | 'es';

const locales: Record<SeedLang, SeedLocale> = { en: enLocale, es: esLocale };

// ── Helpers ──────────────────────────────────────────────────────────────────

type SqlValue = number | string | null;

function ins(db: SqlJsDatabase, table: string, cols: string[], vals: SqlValue[]): number {
  const placeholders = cols.map(() => '?').join(', ');
  db.run(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`, vals);
  return (db.exec('SELECT last_insert_rowid()')[0].values[0][0]) as number;
}

function dt(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function ds(offsetDays = 0): string {
  return dt(offsetDays).split('T')[0];
}

function deadline(offset: number | string | null): string | null {
  if (offset === null) return null;
  if (typeof offset === 'string') return offset;
  return ds(offset);
}

// ── Seed entry point ─────────────────────────────────────────────────────────

const LEGACY_DEMO_EMAILS = ['demo@demo.stackbp'];

export async function seedDemoUser(lang: SeedLang = 'es'): Promise<void> {
  // 1. Clean up any legacy demo email rows
  for (const old of LEGACY_DEMO_EMAILS) {
    if (old !== DEMO_EMAIL) deleteUserByEmail(old);
  }

  // 2. Ensure demo user exists in auth store
  if (!userExists(DEMO_EMAIL)) {
    createUser(DEMO_EMAIL, DEMO_USERNAME, DEMO_PASSWORD);
  }

  // 3. Wipe and recreate the in-memory DB
  closeUserDb(DEMO_USERNAME);
  await openUserDb(DEMO_USERNAME); // runs migrations automatically

  const sqlite = getUserSqlite(DEMO_USERNAME)!;

  // 4. Populate with demo data
  populate(sqlite, lang);

  logger.info('seed', `Demo user "${DEMO_USERNAME}" seeded (${lang})`);
}

// ── Populate ─────────────────────────────────────────────────────────────────

function populate(db: SqlJsDatabase, lang: SeedLang): void {
  const L = locales[lang];

  // Mission
  const missionId = ins(
    db,
    'mission',
    ['title', 'description', 'status', 'created_at', 'updated_at'],
    [L.missionTitle, L.missionDesc, 'in_progress', dt(-20), dt(-1)],
  );

  // Objectives
  const objIds = SEED_OBJECTIVES.map((o) =>
    ins(
      db,
      'objectives',
      ['mission_id', 'title', 'description', 'sort_order', 'status', 'created_at', 'updated_at'],
      [missionId, L[o.titleKey], L[o.descKey], o.sortOrder, o.status, dt(o.createdOffset), dt(o.updatedOffset)],
    ),
  );

  // Plans
  const planIds = SEED_PLANS.map((p) =>
    ins(
      db,
      'plans',
      ['objective_id', 'title', 'description', 'sort_order', 'status', 'deadline', 'created_at', 'updated_at'],
      [
        objIds[p.objectiveIdx],
        L[p.titleKey],
        L[p.descKey],
        p.sortOrder,
        p.status,
        deadline(p.deadlineOffset),
        dt(p.createdOffset),
        dt(p.updatedOffset),
      ],
    ),
  );

  // Tasks
  for (const t of SEED_TASKS) {
    db.run(
      `INSERT INTO tasks (plan_id, title, description, status, priority, sort_order, deadline, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        planIds[t.planIdx],
        L[t.titleKey],
        t.descKey ? L[t.descKey] : null,
        t.status,
        t.priority,
        t.sortOrder,
        deadline(t.deadlineOffset),
        t.completedOffset !== null ? dt(t.completedOffset) : null,
        dt(t.createdOffset),
        dt(t.updatedOffset),
      ],
    );
  }

  // Projects
  const projIds = SEED_PROJECTS.map((p) =>
    ins(
      db,
      'projects',
      ['name', 'path', 'description', 'url', 'status', 'tags', 'created_at', 'updated_at'],
      [
        L[p.nameKey],
        null,
        L[p.descKey],
        p.url,
        p.status,
        JSON.stringify(p.tags),
        dt(p.createdOffset),
        dt(p.updatedOffset),
      ],
    ),
  );

  // Project links
  for (const pl of SEED_PROJECT_LINKS) {
    const targetId = pl.targetIdx === 'mission' ? missionId : objIds[pl.targetIdx];
    db.run(
      `INSERT INTO project_links (project_id, linkable_type, linkable_id, created_at) VALUES (?, ?, ?, ?)`,
      [projIds[pl.projectIdx], pl.linkableType, targetId, dt(pl.createdOffset)],
    );
  }

  // Ideas
  const ideaIds: number[] = [];
  for (const idea of SEED_IDEAS) {
    ideaIds.push(
      ins(
        db,
        'ideas',
        ['title', 'description', 'status', 'target_type', 'target_id', 'project_id', 'created_at', 'updated_at'],
        [
          L[idea.titleKey],
          L[idea.descKey],
          idea.status,
          idea.targetType,
          idea.targetObjIdx !== null ? objIds[idea.targetObjIdx] : null,
          idea.projectIdx !== null ? projIds[idea.projectIdx] : null,
          dt(idea.createdOffset),
          dt(idea.updatedOffset),
        ],
      ),
    );
  }

  // Idea evaluations
  for (const e of SEED_EVALUATIONS) {
    db.run(
      `INSERT INTO idea_evaluations (idea_id, alignment_score, impact_score, cost_score, risk_score, total_score, reasoning, decision, decided_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ideaIds[e.ideaIdx],
        e.alignment,
        e.impact,
        e.cost,
        e.risk,
        e.total,
        L[e.reasoningKey],
        e.decision,
        e.decidedOffset !== null ? dt(e.decidedOffset) : null,
        dt(e.createdOffset),
      ],
    );
  }

  // Activity log
  for (const a of SEED_ACTIVITIES) {
    let entityId: number;
    const ref = a.entityRef;
    if (ref.type === 'mission') entityId = missionId;
    else if (ref.type === 'objective') entityId = objIds[ref.idx];
    else if (ref.type === 'idea') entityId = ideaIds[ref.idx];
    else entityId = ref.n;
    db.run(
      `INSERT INTO activity_log (action, entity_type, entity_id, description, created_at) VALUES (?, ?, ?, ?, ?)`,
      [a.action, a.entityType, entityId, L[a.descKey], dt(a.createdOffset)],
    );
  }

  // Docs — folders (root id=1 already seeded by migration)
  const archFolderId = ins(
    db,
    'doc_folders',
    ['parent_id', 'name', 'sort_order', 'created_at', 'updated_at'],
    [1, L.docFolderArchitecture, 0, dt(-12), dt(-3)],
  );
  const procFolderId = ins(
    db,
    'doc_folders',
    ['parent_id', 'name', 'sort_order', 'created_at', 'updated_at'],
    [1, L.docFolderProcesses, 1, dt(-12), dt(-4)],
  );
  const notesFolderId = ins(
    db,
    'doc_folders',
    ['parent_id', 'name', 'sort_order', 'created_at', 'updated_at'],
    [1, L.docFolderNotes, 2, dt(-8), dt(-1)],
  );

  // Docs — files
  db.run(
    `INSERT INTO doc_files (folder_id, name, content, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [archFolderId, L.docFileSystemDesign, DOC_SYSTEM_DESIGN, 0, dt(-11), dt(-3)],
  );
  db.run(
    `INSERT INTO doc_files (folder_id, name, content, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [archFolderId, L.docFileApiRef, DOC_API_REFERENCE, 1, dt(-10), dt(-2)],
  );
  db.run(
    `INSERT INTO doc_files (folder_id, name, content, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [procFolderId, L.docFileDeploy, DOC_DEPLOY, 0, dt(-9), dt(-4)],
  );
  db.run(
    `INSERT INTO doc_files (folder_id, name, content, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [procFolderId, L.docFileGitWorkflow, DOC_GIT_WORKFLOW, 1, dt(-9), dt(-5)],
  );
  db.run(
    `INSERT INTO doc_files (folder_id, name, content, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [notesFolderId, L.docFileSprintNotes, DOC_SPRINT_NOTES, 0, dt(-7), dt(-1)],
  );

  // Settings
  db.run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, ['language', lang, dt(-20)]);
  db.run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`, ['theme', 'dark', dt(-20)]);
  db.run(
    `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)`,
    ['deadlineAlerts', 'true', dt(-10)],
  );
}
