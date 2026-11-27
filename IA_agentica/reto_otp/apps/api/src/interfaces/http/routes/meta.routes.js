import { Router } from 'express';
import { asyncRoute } from '../middleware/errors.js';
import { demoUser, evaluationRepository, projectRepository } from '../../infrastructure/container.js';

export const metaRouter = Router();

metaRouter.get('/health', (_request, response) => {
  response.json({ ok: true, service: 'orion-api', time: new Date().toISOString() });
});

metaRouter.get('/bootstrap', asyncRoute(async (_request, response) => {
  const [projects, evaluations] = await Promise.all([
    projectRepository.list(),
    evaluationRepository.list()
  ]);
  response.json({ user: demoUser, projects, evaluations });
}));
