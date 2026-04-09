import { eq, or, like } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { docFolders, docFiles } from '../db/schema';

const now = () => new Date().toISOString();

export interface NewFolder {
  name: string;
  parentId: number | null;
  sortOrder?: number;
}

export interface NewFile {
  name: string;
  folderId: number;
  content?: string;
  sortOrder?: number;
}

export const docsRepo = {
  findAllFolders() {
    return getDb().select().from(docFolders).all();
  },

  findFolderById(id: number) {
    return getDb().select().from(docFolders).where(eq(docFolders.id, id)).get();
  },

  createFolder(data: NewFolder) {
    return getDb()
      .insert(docFolders)
      .values({
        name: data.name,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder ?? 0,
        createdAt: now(),
        updatedAt: now(),
      })
      .returning()
      .get();
  },

  renameFolder(id: number, name: string) {
    return getDb().update(docFolders).set({ name, updatedAt: now() }).where(eq(docFolders.id, id)).returning().get();
  },

  updateFolderSortOrder(id: number, sortOrder: number) {
    return getDb()
      .update(docFolders)
      .set({ sortOrder, updatedAt: now() })
      .where(eq(docFolders.id, id))
      .returning()
      .get();
  },

  // BFS collect all descendant ids, then delete files → folders (deepest first) in a transaction
  deleteFolder(id: number) {
    const db = getDb();
    const idsToDelete: number[] = [id];
    const queue: number[] = [id];
    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = db.select({ id: docFolders.id }).from(docFolders).where(eq(docFolders.parentId, parentId)).all();
      for (const child of children) {
        idsToDelete.push(child.id);
        queue.push(child.id);
      }
    }
    db.transaction((tx) => {
      for (const fid of idsToDelete) {
        tx.delete(docFiles).where(eq(docFiles.folderId, fid)).run();
      }
      for (const fid of [...idsToDelete].reverse()) {
        tx.delete(docFolders).where(eq(docFolders.id, fid)).run();
      }
    });
  },

  // Returns all files WITHOUT content for lightweight tree loading
  findAllFiles() {
    return getDb()
      .select({
        id: docFiles.id,
        folderId: docFiles.folderId,
        name: docFiles.name,
        sortOrder: docFiles.sortOrder,
        createdAt: docFiles.createdAt,
        updatedAt: docFiles.updatedAt,
      })
      .from(docFiles)
      .all();
  },

  findFileById(id: number) {
    return getDb().select().from(docFiles).where(eq(docFiles.id, id)).get();
  },

  createFile(data: NewFile) {
    return getDb()
      .insert(docFiles)
      .values({
        name: data.name,
        folderId: data.folderId,
        content: data.content ?? '',
        sortOrder: data.sortOrder ?? 0,
        createdAt: now(),
        updatedAt: now(),
      })
      .returning()
      .get();
  },

  updateFile(id: number, data: Partial<{ name: string; content: string; sortOrder: number }>) {
    return getDb()
      .update(docFiles)
      .set({ ...data, updatedAt: now() })
      .where(eq(docFiles.id, id))
      .returning()
      .get();
  },

  deleteFile(id: number) {
    return getDb().delete(docFiles).where(eq(docFiles.id, id)).run();
  },

  searchFiles(q: string) {
    const pattern = `%${q}%`;
    return getDb()
      .select({
        id: docFiles.id,
        folderId: docFiles.folderId,
        name: docFiles.name,
        sortOrder: docFiles.sortOrder,
        createdAt: docFiles.createdAt,
        updatedAt: docFiles.updatedAt,
      })
      .from(docFiles)
      .where(or(like(docFiles.name, pattern), like(docFiles.content, pattern)))
      .all();
  },
};
