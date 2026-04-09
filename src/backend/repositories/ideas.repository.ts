import { eq } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { ideas, ideaEvaluations } from '../db/schema';

const now = () => new Date().toISOString();

export const ideasRepo = {
  findAll() {
    return getDb().select().from(ideas).all();
  },

  findByStatus(status: string) {
    return getDb().select().from(ideas).where(eq(ideas.status, status)).all();
  },

  findById(id: number) {
    return getDb().select().from(ideas).where(eq(ideas.id, id)).get();
  },

  create(data: { title: string; description?: string; targetType?: string; targetId?: number; projectId?: number }) {
    return getDb()
      .insert(ideas)
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
      targetType: string | null;
      targetId: number | null;
      projectId: number | null;
      promotedToType: string;
      promotedToId: number;
    }>,
  ) {
    return getDb()
      .update(ideas)
      .set({ ...data, updatedAt: now() })
      .where(eq(ideas.id, id))
      .returning()
      .get();
  },

  delete(id: number) {
    getDb().delete(ideaEvaluations).where(eq(ideaEvaluations.ideaId, id)).run();
    return getDb().delete(ideas).where(eq(ideas.id, id)).run();
  },

  // Evaluations
  findEvaluation(ideaId: number) {
    return getDb().select().from(ideaEvaluations).where(eq(ideaEvaluations.ideaId, ideaId)).get();
  },

  upsertEvaluation(
    ideaId: number,
    data: {
      alignmentScore: number;
      impactScore: number;
      costScore: number;
      riskScore: number;
      totalScore: number;
      reasoning?: string;
    },
  ) {
    const existing = this.findEvaluation(ideaId);
    if (existing) {
      return getDb()
        .update(ideaEvaluations)
        .set({ ...data })
        .where(eq(ideaEvaluations.ideaId, ideaId))
        .returning()
        .get();
    }
    return getDb()
      .insert(ideaEvaluations)
      .values({ ideaId, ...data, createdAt: now() })
      .returning()
      .get();
  },

  updateEvaluationDecision(ideaId: number, decision: string) {
    return getDb()
      .update(ideaEvaluations)
      .set({ decision, decidedAt: now() })
      .where(eq(ideaEvaluations.ideaId, ideaId))
      .returning()
      .get();
  },
};
