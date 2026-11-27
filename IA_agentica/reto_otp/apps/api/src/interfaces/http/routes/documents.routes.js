import { Router } from 'express';
import { asyncRoute } from '../middleware/errors.js';
import { documentRepository, documentStore } from '../../infrastructure/container.js';

export const documentsRouter = Router();

documentsRouter.get('/:id/file', asyncRoute(async (request, response) => {
  const document = await documentRepository.getById(request.params.id);
  if (!document) return response.status(404).json({ error: { code: 'not_found', message: 'Documento no encontrado' } });
  const buffer = await documentStore.read(document);
  return response.type(document.mime || 'application/octet-stream').send(buffer);
}));
