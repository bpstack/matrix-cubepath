import { getDb } from './connection';
import { sql } from 'drizzle-orm';

export function runMigrations() {
  const db = getDb();

  db.run(sql`CREATE TABLE IF NOT EXISTS mission (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS objectives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_id INTEGER REFERENCES mission(id),
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    objective_id INTEGER REFERENCES objectives(id),
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress',
    deadline TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER REFERENCES plans(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT NOT NULL DEFAULT 'medium',
    sort_order INTEGER DEFAULT 0,
    deadline TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT,
    description TEXT,
    url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    tags TEXT,
    tech_stats TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS project_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    linkable_type TEXT NOT NULL,
    linkable_id INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.run(
    sql.raw(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_project_links_unique ON project_links(project_id, linkable_type, linkable_id)`,
    ),
  );

  db.run(sql`CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    promoted_to_type TEXT,
    promoted_to_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  // Add new columns to projects if missing (migration from Phase 1 → Phase 2)
  try {
    db.run(sql.raw(`ALTER TABLE projects ADD COLUMN url TEXT`));
  } catch {
    /* already exists */
  }
  try {
    db.run(sql.raw(`ALTER TABLE projects ADD COLUMN tags TEXT`));
  } catch {
    /* already exists */
  }
  try {
    db.run(sql.raw(`ALTER TABLE projects ADD COLUMN tech_stats TEXT`));
  } catch {
    /* already exists */
  }

  db.run(sql`CREATE TABLE IF NOT EXISTS project_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    total_tasks INTEGER NOT NULL DEFAULT 0,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    blockers INTEGER NOT NULL DEFAULT 0,
    wip_items INTEGER NOT NULL DEFAULT 0,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    raw_data TEXT,
    scanned_at TEXT NOT NULL
  )`);

  // Phase 3: Add new columns to ideas
  try {
    db.run(sql.raw(`ALTER TABLE ideas ADD COLUMN target_type TEXT`));
  } catch {
    /* already exists */
  }
  try {
    db.run(sql.raw(`ALTER TABLE ideas ADD COLUMN target_id INTEGER`));
  } catch {
    /* already exists */
  }
  try {
    db.run(sql.raw(`ALTER TABLE ideas ADD COLUMN project_id INTEGER`));
  } catch {
    /* already exists */
  }

  db.run(sql`CREATE TABLE IF NOT EXISTS idea_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idea_id INTEGER NOT NULL UNIQUE,
    alignment_score INTEGER NOT NULL,
    impact_score INTEGER NOT NULL,
    cost_score INTEGER NOT NULL,
    risk_score INTEGER NOT NULL,
    total_score REAL NOT NULL,
    reasoning TEXT,
    decision TEXT NOT NULL DEFAULT 'pending',
    decided_at TEXT,
    created_at TEXT NOT NULL
  )`);

  // Fix old scores stored in 0-1 range → multiply to 1-10 range
  db.run(sql.raw(`UPDATE idea_evaluations SET total_score = total_score * 10 WHERE total_score <= 1`));

  db.run(sql`CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);


  db.run(sql`CREATE TABLE IF NOT EXISTS daily_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS doc_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id INTEGER,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  db.run(sql`CREATE TABLE IF NOT EXISTS doc_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_id INTEGER NOT NULL REFERENCES doc_folders(id),
    name TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);

  // Seed root folder (id=1) — INSERT OR IGNORE is idempotent on existing DBs
  db.run(
    sql.raw(
      `INSERT OR IGNORE INTO doc_folders (id, parent_id, name, sort_order, created_at, updated_at) VALUES (1, NULL, 'Docs', 0, datetime('now'), datetime('now'))`,
    ),
  );

  // FK indexes for query performance
  db.run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_objectives_mission_id ON objectives(mission_id)`));
  db.run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_plans_objective_id ON plans(objective_id)`));
  db.run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_tasks_plan_id ON tasks(plan_id)`));
  db.run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_project_links_project_id ON project_links(project_id)`));
  db.run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_project_links_linkable ON project_links(linkable_type, linkable_id)`));
  db.run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_project_scans_project_id ON project_scans(project_id)`));
  db.run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_idea_evaluations_idea_id ON idea_evaluations(idea_id)`));
  db.run(sql.raw(`CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id)`));
}
