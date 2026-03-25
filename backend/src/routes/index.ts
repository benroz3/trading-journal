import { Router } from 'express';
import strategiesRoutes from './strategies.routes';
import tradesRoutes from './trades.routes';
import imagesRoutes from './images.routes';
import * as statsController from '../controllers/stats.controller';

const router = Router();

// Resource routes
router.use('/strategies', strategiesRoutes);
router.use('/trades', tradesRoutes);
router.use('/', imagesRoutes);

// Stats routes
router.get('/stats/summary', statsController.getSummary);
router.get('/stats/by-strategy', statsController.getByStrategy);
router.get('/stats/by-symbol', statsController.getBySymbol);
router.get('/stats/by-session', statsController.getBySession);
router.get('/stats/by-day-of-week', statsController.getByDayOfWeek);
router.get('/stats/equity-curve', statsController.getEquityCurve);
router.get('/stats/calendar', statsController.getCalendar);
router.get('/stats/streaks', statsController.getStreaks);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
