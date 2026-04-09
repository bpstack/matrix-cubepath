import { Request, Response } from 'express';
import { docsRepo } from '../repositories/docs.repository';

const ROOT_FOLDER_ID = 1;

export const docsController = {
  getTree(_req: Request, res: Response) {
    const folders = docsRepo.findAllFolders();
    const files = docsRepo.findAllFiles();
    res.json({ folders, files });
  },

  createFolder(req: Request, res: Response) {
    const { name, parentId } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const folder = docsRepo.createFolder({
      name: name.trim(),
      parentId: parentId != null ? Number(parentId) : ROOT_FOLDER_ID,
    });
    res.status(201).json(folder);
  },

  renameFolder(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (id === ROOT_FOLDER_ID) {
      return res.status(403).json({ error: 'Root folder cannot be renamed' });
    }
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    const folder = docsRepo.renameFolder(id, name.trim());
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    res.json(folder);
  },

  updateFolderSortOrder(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { sortOrder } = req.body;
    if (sortOrder === undefined || typeof sortOrder !== 'number') {
      return res.status(400).json({ error: 'sortOrder must be a number' });
    }
    const folder = docsRepo.updateFolderSortOrder(id, sortOrder);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    res.json(folder);
  },

  deleteFolder(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (id === ROOT_FOLDER_ID) {
      return res.status(403).json({ error: 'Root folder cannot be deleted' });
    }
    const folder = docsRepo.findFolderById(id);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    docsRepo.deleteFolder(id);
    res.status(204).send();
  },

  getFile(req: Request, res: Response) {
    const file = docsRepo.findFileById(Number(req.params.id));
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  },

  createFile(req: Request, res: Response) {
    const { name, folderId } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }
    const file = docsRepo.createFile({
      name: name.trim(),
      folderId: Number(folderId),
      content: '',
    });
    res.status(201).json(file);
  },

  updateFile(req: Request, res: Response) {
    const id = Number(req.params.id);
    const { name, content, sortOrder } = req.body;
    const data: Partial<{ name: string; content: string; sortOrder: number }> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (content !== undefined) data.content = String(content);
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    const file = docsRepo.updateFile(id, data);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  },

  deleteFile(req: Request, res: Response) {
    const id = Number(req.params.id);
    const file = docsRepo.findFileById(id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    docsRepo.deleteFile(id);
    res.status(204).send();
  },

  searchFiles(req: Request, res: Response) {
    const q = String(req.query.q ?? '').trim();
    if (q.length < 2) {
      return res.json([]);
    }
    const results = docsRepo.searchFiles(q);
    res.json(results);
  },
};
