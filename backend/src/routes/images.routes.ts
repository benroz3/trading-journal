import { Router } from 'express';
import * as controller from '../controllers/images.controller';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/trades/:tradeId/images', upload.array('images', 5), controller.upload);
router.delete('/images/:id', controller.remove);
router.get('/images/:id/file', controller.serve);

export default router;
