import { Router } from 'express';
import * as controller from '../controllers/trades.controller';
import { validate } from '../middleware/validate';
import { createTradeSchema, updateTradeSchema } from '../schemas/trade.schema';

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createTradeSchema), controller.create);
router.put('/:id', validate(updateTradeSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
