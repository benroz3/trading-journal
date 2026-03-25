import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { runMigrations } from './db/migrate';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

async function main(): Promise<void> {
  // Run database migrations
  await runMigrations();

  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors());

  // Request logging
  app.use(morgan('short'));

  // Body parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API routes
  app.use('/api', routes);

  // Error handling (must be after routes)
  app.use(errorHandler);

  // Start server
  app.listen(env.PORT, () => {
    console.log(`[Server] Trading Journal API running on port ${env.PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
