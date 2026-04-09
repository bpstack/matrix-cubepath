import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { mission } from '../db/schema';

const now = () => new Date().toISOString();

export const missionRepo = {
  findAll() {
    return getDb().select().from(mission).all();
  },

  findById(id: number) {
    return getDb().select().from(mission).where(eq(mission.id, id)).get();
  },

  create(data: { title: string; description?: string }) {
    return getDb()
      .insert(mission)
      .values({ ...data, createdAt: now(), updatedAt: now() })
      .returning()
      .get();
  },

  update(id: number, data: Partial<{ title: string; description: string; status: string }>) {
    return getDb()
      .update(mission)
      .set({ ...data, updatedAt: now() })
      .where(eq(mission.id, id))
      .returning()
      .get();
  },

  delete(id: number) {
    return getDb().delete(mission).where(eq(mission.id, id)).run();
  },
};
