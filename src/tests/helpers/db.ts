/**
 * Test helpers — async factory using sql.js (in-memory WebAssembly SQLite).
 * These are not currently used by the test suite but are available for
 * integration tests that need a real database instance.
 */

import initSqlJs, { Database } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import { sql } from 'drizzle-orm';

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS mission (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
    description TEXT, status TEXT NOT NULL DEFAULT 'in_progress',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS objectives (
    id INTEGER PRIMARY KEY AUTOINCREMENT, mission_id INTEGER REFERENCES mission(id),
    title TEXT NOT NULL, description TEXT, sort_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT, objective_id INTEGER REFERENCES objectives(id),
    title TEXT NOT NULL, description TEXT, sort_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress', deadline TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id INTEGER REFERENCES plans(id),
    title TEXT NOT NULL, description TEXT, status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium', sort_order INTEGER DEFAULT 0,
    deadline TEXT, completed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, path TEXT,
    description TEXT, url TEXT, status TEXT NOT NULL DEFAULT 'active',
    tags TEXT, tech_stats TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS project_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id),
    linkable_type TEXT NOT NULL, linkable_id INTEGER NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', promoted_to_type TEXT, promoted_to_id INTEGER,
    target_type TEXT, target_id INTEGER, project_id INTEGER,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS idea_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, idea_id INTEGER NOT NULL UNIQUE,
    alignment_score INTEGER NOT NULL, impact_score INTEGER NOT NULL,
    cost_score INTEGER NOT NULL, risk_score INTEGER NOT NULL,
    total_score REAL NOT NULL, reasoning TEXT, decision TEXT NOT NULL DEFAULT 'pending',
    decided_at TEXT, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS project_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL REFERENCES projects(id),
    total_tasks INTEGER NOT NULL DEFAULT 0, completed_tasks INTEGER NOT NULL DEFAULT 0,
    blockers INTEGER NOT NULL DEFAULT 0, wip_items INTEGER NOT NULL DEFAULT 0,
    progress_percent INTEGER NOT NULL DEFAULT 0, raw_data TEXT, scanned_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL,
    entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL,
    description TEXT NOT NULL, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
`;

export async function createTestDb(): Promise<Database> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.exec(SCHEMA_SQL);
  return db;
}

const schema = {
  mission: sql`mission`,
  objectives: sql`objectives`,
  plans: sql`plans`,
  tasks: sql`tasks`,
  projects: sql`projects`,
  projectLinks: sql`project_links`,
  ideas: sql`ideas`,
  ideaEvaluations: sql`idea_evaluations`,
  projectScans: sql`project_scans`,
  activityLog: sql`activity_log`,
  settings: sql`settings`,
};

export async function createTestDrizzle() {
  const sqliteDb = await createTestDb();
  const db = drizzle(sqliteDb, { schema });
  return { db, sqliteDb };
}
