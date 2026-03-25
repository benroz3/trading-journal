import { Router } from 'express';
import * as controller from '../controllers/strategies.controller';
import { validate } from '../middleware/validate';
import { createStrategySchema, updateStrategySchema } from '../schemas/strategy.schema';

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createStrategySchema), controller.create);
router.put('/:id', validate(updateStrategySchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
