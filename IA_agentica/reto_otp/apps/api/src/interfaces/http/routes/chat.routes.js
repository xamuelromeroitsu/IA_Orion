import { Router } from 'express';
import { asyncRoute } from '../middleware/errors.js';
import { askProjectDocumentsUseCase, chatRepository, evaluationRepository } from '../../infrastructure/container.js';

export const chatRouter = Router();

chatRouter.get('/project/:projectId/messages', asyncRoute(async (request, response) => {
  response.json({ messages: await chatRepository.listByProject(request.params.projectId) });
}));

chatRouter.post('/evaluations/:id/chat', asyncRoute(async (request, response) => {
  const evaluation = await evaluationRepository.getById(request.params.id);
  const message = await askProjectDocumentsUseCase.execute({
    projectId: evaluation.projectId,
    question: String(request.body?.question ?? '').trim()
  });
  response.json(message);
}));
