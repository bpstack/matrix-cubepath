import { getDb } from '../db/connection';
import { sql } from 'drizzle-orm';

export const notesRepository = {
  getDates(): string[] {
    const db = getDb();
    const rows = db.all(sql`SELECT date FROM daily_notes WHERE content != '' ORDER BY date DESC`) as { date: string }[];
    return rows.map((r) => r.date);
  },

  getByDate(date: string): string {
    const db = getDb();
    const row = db.get(sql`SELECT content FROM daily_notes WHERE date = ${date}`) as { content: string } | undefined;
    return row?.content ?? '';
  },

  upsert(date: string, content: string): void {
    const db = getDb();
    const now = new Date().toISOString();
    db.run(sql`INSERT INTO daily_notes (date, content, updated_at) VALUES (${date}, ${content}, ${now})
      ON CONFLICT(date) DO UPDATE SET content = ${content}, updated_at = ${now}`);
  },
};
