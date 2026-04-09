import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { tasks } from '../db/schema';

const now = () => new Date().toISOString();

export const tasksRepo = {
  findAll() {
    return getDb().select().from(tasks).all();
  },

  findByPlanId(planId: number) {
    return getDb().select().from(tasks).where(eq(tasks.planId, planId)).all();
  },

  findByStatus(status: string) {
    return getDb().select().from(tasks).where(eq(tasks.status, status)).all();
  },

  findFiltered(filters: { planId?: number; status?: string }) {
    const conditions = [];
    if (filters.planId) conditions.push(eq(tasks.planId, filters.planId));
    if (filters.status) conditions.push(eq(tasks.status, filters.status));
    if (conditions.length === 0) return getDb().select().from(tasks).all();
    return getDb()
      .select()
      .from(tasks)
      .where(and(...conditions))
      .all();
  },

  findById(id: number) {
    return getDb().select().from(tasks).where(eq(tasks.id, id)).get();
  },

  create(data: {
    planId: number;
    title: string;
    description?: string;
    priority?: string;
    sortOrder?: number;
    deadline?: string;
  }) {
    return getDb()
      .insert(tasks)
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
      priority: string;
      sortOrder: number;
      planId: number;
      deadline: string | null;
      completedAt: string | null;
    }>,
  ) {
    return getDb()
      .update(tasks)
      .set({ ...data, updatedAt: now() })
      .where(eq(tasks.id, id))
      .returning()
      .get();
  },

  reassignToPlan(ids: number[], newPlanId: number) {
    for (const id of ids) {
      getDb().update(tasks).set({ planId: newPlanId, updatedAt: now() }).where(eq(tasks.id, id)).run();
    }
  },

  delete(id: number) {
    return getDb().delete(tasks).where(eq(tasks.id, id)).run();
  },
};
