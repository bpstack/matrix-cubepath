import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { settings } from '../db/schema';

const now = () => new Date().toISOString();

export const settingsRepo = {
  findAll() {
    const rows = getDb().select().from(settings).all();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  },

  findByKey(key: string) {
    return getDb().select().from(settings).where(eq(settings.key, key)).get();
  },

  upsert(key: string, value: string) {
    const existing = getDb().select().from(settings).where(eq(settings.key, key)).get();
    if (existing) {
      return getDb().update(settings).set({ value, updatedAt: now() }).where(eq(settings.key, key)).returning().get();
    }
    return getDb().insert(settings).values({ key, value, updatedAt: now() }).returning().get();
  },

  delete(key: string) {
    return getDb().delete(settings).where(eq(settings.key, key)).run();
  },
};
