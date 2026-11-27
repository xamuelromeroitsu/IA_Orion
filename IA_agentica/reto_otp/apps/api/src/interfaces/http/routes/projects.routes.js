import { Router } from 'express';
import { asyncRoute } from '../../middleware/errors.js';
import { requireRole } from '../../middleware/auth.js';
import { uploadMany } from '../../middleware/upload.js';
import {
  analysisRepository,
  createAuditor,
  documentRepository,
  documentStore,
  eventBus,
  exchangeRatePort
} from '../../../infrastructure/container.js';
import { extractDocument } from '../../../infrastructure/parsing/TextExtractor.js';
import { AnalyzeDocumentUseCase } from '../../../application/useCases/AnalyzeDocumentUseCase.js';
import { manageProjectWorkflowUseCase } from '../../../infrastructure/container.js';

export const projectsRouter = Router();

projectsRouter.get('/', asyncRoute(async (_request, response) => {
  response.json({ projects: await manageProjectWorkflowUseCase.listProjects() });
}));

projectsRouter.post('/', requireRole('cargador'), asyncRoute(async (request, response) => {
  const project = await manageProjectWorkflowUseCase.createProject(request.body ?? {});
  response.status(201).json(project);
}));

projectsRouter.get('/:id', asyncRoute(async (request, response) => {
  const project = await manageProjectWorkflowUseCase.getProject(request.params.id);
  const [documents, analyses] = await Promise.all([
    documentRepository.listByProject(project.id),
    analysisRepository.listByProject(project.id)
  ]);
  response.json({ project, documents, analyses });
}));

projectsRouter.get('/:id/documents', asyncRoute(async (request, response) => {
  const [documents, analyses] = await Promise.all([
    documentRepository.listByProject(request.params.id),
    analysisRepository.listByProject(request.params.id)
  ]);
  response.json({ documents, analyses });
}));

projectsRouter.post('/:id/documents', requireRole('cargador', 'revisor'), uploadMany, asyncRoute(async (request, response) => {
  const projectId = request.params.id;
  await manageProjectWorkflowUseCase.getProject(projectId);
  const files = request.files ?? [];
  if (files.length === 0) {
    return response.status(400).json({ error: { code: 'no_files', message: 'Se requiere al menos un archivo' } });
  }

  const documents = [];
  const analyses = [];
  for (const file of files) {
    const extracted = await extractDocument({
      buffer: file.buffer,
      mime: file.mimetype,
      fileName: file.originalname
    });
    const stored = await documentStore.save({
      buffer: file.buffer,
      fileName: file.originalname,
      projectId
    });
    const document = {
      id: stored.id,
      projectId,
      fileName: file.originalname,
      mime: file.mimetype,
      kind: extracted.kind,
      size: file.size,
      storagePath: stored.storagePath,
      sha256: stored.sha256,
      iv: stored.iv,
      tag: stored.tag,
      uploadedAt: new Date().toISOString(),
      extractedText: extracted.extractedText,
      sheets: extracted.sheets
    };
    await documentRepository.save(document);
    documents.push(document);

    const auditor = createAuditor(extracted.kind === 'image' || extracted.kind === 'pdf'
      ? file.buffer.toString('base64')
      : null);
    const useCase = new AnalyzeDocumentUseCase({
      aiAuditor: auditor,
      analysisRepository,
      eventPublisher: eventBus,
      exchangeRatePort
    });
    const analysis = await useCase.execute({
      projectId,
      document: { ...document, kind: extracted.kind },
      requirement: await manageProjectWorkflowUseCase.getProject(projectId)
    });
    analyses.push(analysis);
  }

  await manageProjectWorkflowUseCase.updateStatus(projectId, 'evaluacion');
  return response.status(201).json({ documents, analyses });
}));
