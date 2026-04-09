import { Router } from 'express';
import { docsController } from '../controllers/docs.controller';

const router = Router();

router.get('/docs/tree', docsController.getTree);
router.get('/docs/search', docsController.searchFiles);
router.post('/docs/folders', docsController.createFolder);
router.patch('/docs/folders/:id/sort', docsController.updateFolderSortOrder);
router.patch('/docs/folders/:id', docsController.renameFolder);
router.delete('/docs/folders/:id', docsController.deleteFolder);
router.get('/docs/files/:id', docsController.getFile);
router.post('/docs/files', docsController.createFile);
router.patch('/docs/files/:id', docsController.updateFile);
router.delete('/docs/files/:id', docsController.deleteFile);

export { router as docsRouter };
