import { Router } from 'express';
import { asyncRoute } from '../../middleware/errors.js';
import { documentRepository, documentStore } from '../../../infrastructure/container.js';

export const documentsRouter = Router();

documentsRouter.get('/:id/file', asyncRoute(async (request, response) => {
  const document = await documentRepository.getById(request.params.id);
  if (!document) return response.status(404).json({ error: { code: 'not_found', message: 'Documento no encontrado' } });
  const buffer = await documentStore.read(document);
  const fileName = String(document.fileName || 'documento')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120) || 'documento';
  const isXlsx = fileName.toLowerCase().endsWith('.xlsx');
  const contentType = isXlsx
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : document.mime || 'application/octet-stream';
  response.setHeader('Content-Type', contentType);
  response.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  return response.send(buffer);
}));
