import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { plans } from '../db/schema';

const now = () => new Date().toISOString();

export const plansRepo = {
  findAll() {
    return getDb().select().from(plans).all();
  },

  findByObjectiveId(objectiveId: number) {
    return getDb().select().from(plans).where(eq(plans.objectiveId, objectiveId)).all();
  },

  findById(id: number) {
    return getDb().select().from(plans).where(eq(plans.id, id)).get();
  },

  create(data: { objectiveId: number; title: string; description?: string; sortOrder?: number; deadline?: string }) {
    return getDb()
      .insert(plans)
      .values({ ...data, createdAt: now(), updatedAt: now() })
      .returning()
      .get();
  },

  update(
    id: number,
    data: Partial<{
      title: string;
      description: string;
      status: string;
      sortOrder: number;
      objectiveId: number;
      deadline: string;
    }>,
  ) {
    return getDb()
      .update(plans)
      .set({ ...data, updatedAt: now() })
      .where(eq(plans.id, id))
      .returning()
      .get();
  },

  reassignToObjective(ids: number[], newObjectiveId: number) {
    for (const id of ids) {
      getDb().update(plans).set({ objectiveId: newObjectiveId, updatedAt: now() }).where(eq(plans.id, id)).run();
    }
  },

  delete(id: number) {
    return getDb().delete(plans).where(eq(plans.id, id)).run();
  },
};
