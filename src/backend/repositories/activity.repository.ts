import { getDb } from '../db/connection';
import { activityLog } from '../db/schema';
import { desc } from 'drizzle-orm';

const now = () => new Date().toISOString();

export const activityRepo = {
  log(action: string, entityType: string, entityId: number, description: string) {
    const db = getDb();
    return db
      .insert(activityLog)
      .values({ action, entityType, entityId, description, createdAt: now() })
      .returning()
      .get();
  },

  findRecent(limit = 20) {
    const db = getDb();
    return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit).all();
  },
};
