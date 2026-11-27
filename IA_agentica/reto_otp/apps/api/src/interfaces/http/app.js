import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { attachUser } from '../middleware/auth.js';
import { errorHandler, notFound } from '../middleware/errors.js';
import { metaRouter } from './routes/meta.routes.js';
import { projectsRouter } from './routes/projects.routes.js';
import { evaluationsRouter } from './routes/evaluations.routes.js';
import { chatRouter } from './routes/chat.routes.js';
import { documentsRouter } from './routes/documents.routes.js';
import { ratesRouter } from './routes/rates.routes.js';

export function createApp() {
  const app = express();
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(attachUser);

  app.use('/api', metaRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/evaluations', evaluationsRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/rates', ratesRouter);
  app.use('/api', chatRouter);
  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
