/**
 * User database layer — one in-memory SQL instance per authenticated user.
 *
 * This build uses sql.js (WebAssembly SQLite) for zero-dependency portability.
 * Data resets on server restart; all reads/writes happen in memory.
 *
 * Production upgrade path: swap sql.js for @libsql/client with the
 * drizzle-orm/libsql adapter. Supports local file:// and remote Turso URLs
 * with the same Drizzle query API surface.
 * See: https://orm.drizzle.team/docs/get-started-sqlite#turso
 */

import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from './schema';
import { userDbContext, UserDb } from './context';
import { runMigrations } from './migrate';

// Initialize the SQL.js engine once; reuse across all user DBs
let _sqlEngine: SqlJsStatic | null = null;
let _sqlEnginePromise: Promise<SqlJsStatic> | null = null;

async function getSqlEngine(): Promise<SqlJsStatic> {
  if (_sqlEngine) return _sqlEngine;
  if (!_sqlEnginePromise) _sqlEnginePromise = initSqlJs();
  _sqlEngine = await _sqlEnginePromise;
  return _sqlEngine;
}

interface CacheEntry {
  db: UserDb;
  sqlite: SqlJsDatabase;
}

const dbCache = new Map<string, CacheEntry>();

export async function openUserDb(username: string): Promise<UserDb> {
  const cached = dbCache.get(username);
  if (cached) return cached.db;

  const SQL = await getSqlEngine();
  const sqlite = new SQL.Database(); // in-memory — no file path needed
  const db = drizzle(sqlite, { schema });
  dbCache.set(username, { db, sqlite });

  // Run schema migrations inside the user context
  userDbContext.run(db, () => runMigrations());

  return db;
}

/** Returns the raw sql.js database for a cached user (used by seeding). */
export function getUserSqlite(username: string): SqlJsDatabase | undefined {
  return dbCache.get(username)?.sqlite;
}

export function closeUserDb(username: string): void {
  const entry = dbCache.get(username);
  if (entry) {
    entry.sqlite.close();
    dbCache.delete(username);
  }
}
