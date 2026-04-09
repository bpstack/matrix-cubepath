import { eq, and } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { projects, projectScans, projectLinks } from '../db/schema';

const now = () => new Date().toISOString();

export const projectsRepo = {
  findAll() {
    return getDb().select().from(projects).all();
  },

  findById(id: number) {
    return getDb().select().from(projects).where(eq(projects.id, id)).get();
  },

  create(data: {
    name: string;
    path?: string;
    description?: string;
    url?: string;
    status?: string;
    tags?: string;
    techStats?: string;
  }) {
    return getDb()
      .insert(projects)
      .values({ ...data, createdAt: now(), updatedAt: now() })
      .returning()
      .get();
  },

  update(
    id: number,
    data: Partial<{
      name: string;
      path: string;
      description: string;
      url: string;
      status: string;
      tags: string;
      techStats: string;
    }>,
  ) {
    return getDb()
      .update(projects)
      .set({ ...data, updatedAt: now() })
      .where(eq(projects.id, id))
      .returning()
      .get();
  },

  delete(id: number) {
    // Delete related scans and links first
    getDb().delete(projectScans).where(eq(projectScans.projectId, id)).run();
    getDb().delete(projectLinks).where(eq(projectLinks.projectId, id)).run();
    return getDb().delete(projects).where(eq(projects.id, id)).run();
  },

  // Scans
  getLatestScan(projectId: number) {
    return getDb().select().from(projectScans).where(eq(projectScans.projectId, projectId)).get();
  },

  upsertScan(
    projectId: number,
    data: {
      totalTasks: number;
      completedTasks: number;
      blockers: number;
      wipItems: number;
      progressPercent: number;
      rawData: string;
    },
  ) {
    const existing = getDb().select().from(projectScans).where(eq(projectScans.projectId, projectId)).get();
    if (existing) {
      return getDb()
        .update(projectScans)
        .set({ ...data, scannedAt: now() })
        .where(eq(projectScans.projectId, projectId))
        .returning()
        .get();
    }
    return getDb()
      .insert(projectScans)
      .values({ projectId, ...data, scannedAt: now() })
      .returning()
      .get();
  },

  // Links
  getLinks(projectId: number) {
    return getDb().select().from(projectLinks).where(eq(projectLinks.projectId, projectId)).all();
  },

  addLink(projectId: number, linkableType: string, linkableId: number) {
    return getDb()
      .insert(projectLinks)
      .values({ projectId, linkableType, linkableId, createdAt: now() })
      .returning()
      .get();
  },

  removeLink(id: number) {
    return getDb().delete(projectLinks).where(eq(projectLinks.id, id)).run();
  },

  removeLinksByEntity(linkableType: string, linkableId: number) {
    const db = getDb();
    return db
      .delete(projectLinks)
      .where(and(eq(projectLinks.linkableType, linkableType), eq(projectLinks.linkableId, linkableId)))
      .run();
  },
};
