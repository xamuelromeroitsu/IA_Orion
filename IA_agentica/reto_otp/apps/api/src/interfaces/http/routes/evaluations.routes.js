import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { asyncRoute } from '../../middleware/errors.js';
import { requireRole } from '../../middleware/auth.js';
import {
  analysisRepository,
  documentRepository,
  evaluationRepository,
  evaluateBatchUseCase,
  eventBus,
  recordHumanReviewUseCase,
  scopedPublisher
} from '../../../infrastructure/container.js';
import { buildExecutivePdf } from '../../../infrastructure/reporting/PdfExporter.js';
import { buildComparisonCsv, buildComparisonXlsx } from '../../../infrastructure/reporting/TabularExporter.js';

export const evaluationsRouter = Router();

async function loadEvaluationContext(evaluationId) {
  const evaluation = await evaluationRepository.getById(evaluationId);
  if (!evaluation) return null;
  const [analyses, documents] = await Promise.all([
    analysisRepository.listByProject(evaluation.projectId),
    documentRepository.listByProject(evaluation.projectId)
  ]);
  return { evaluation, analyses, documents };
}

evaluationsRouter.post('/', requireRole('cargador', 'revisor'), asyncRoute(async (request, response) => {
  const projectId = request.body?.projectId;
  if (!projectId) {
    return response.status(400).json({ error: { code: 'missing_project', message: 'projectId es obligatorio' } });
  }
  const evaluationId = randomUUID();
  const now = new Date().toISOString();
  await evaluationRepository.save({
    id: evaluationId,
    projectId,
    status: 'running',
    startedAt: now,
    finishedAt: null,
    ranking: [],
    comparison: [],
    summary: 'Evaluación en curso',
    recommendedId: null,
    exchangeRate: 1,
    exchangeRateDate: now.slice(0, 10),
    reviewedBy: null,
    reviewNotes: null,
    approvedBy: null
  });
  response.status(202).json({ evaluation: { id: evaluationId, projectId, status: 'running', startedAt: now } });

  setImmediate(async () => {
    try {
      await evaluateBatchUseCase.execute({ projectId, evaluationId, eventPublisher: scopedPublisher(evaluationId) });
    } catch (error) {
      eventBus.publish({
        evaluationId,
        phase: 'failed',
        tool: 'evaluator',
        message: error.message ?? 'Error en la evaluación',
        level: 'error'
      });
      await evaluationRepository.updateReview(evaluationId, { notes: 'error', reviewer: 'system' });
    }
  });
  return undefined;
}));

evaluationsRouter.get('/:id', asyncRoute(async (request, response) => {
  const context = await loadEvaluationContext(request.params.id);
  if (!context) return response.status(404).json({ error: { code: 'not_found', message: 'Evaluación no encontrada' } });
  return response.json(context);
}));

evaluationsRouter.get('/:id/events', (request, response) => {
  response.setHeader('Content-Type', 'text/event-stream');
  response.setHeader('Cache-Control', 'no-cache, no-transform');
  response.setHeader('Connection', 'keep-alive');
  response.flushHeaders();
  const unsubscribe = eventBus.subscribe(request.params.id, response);
  const heartbeat = setInterval(() => response.write(': ping\n\n'), 15000);
  request.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

evaluationsRouter.get('/:id/report.pdf', asyncRoute(async (request, response) => {
  const context = await loadEvaluationContext(request.params.id);
  if (!context) return response.status(404).json({ error: { code: 'not_found', message: 'Evaluación no encontrada' } });
  const pdf = buildExecutivePdf({
    evaluation: context.evaluation,
    analyses: context.analyses,
    project: null
  });
  return response.type('application/pdf').send(Buffer.from(pdf.output('arraybuffer')));
}));

evaluationsRouter.get('/:id/comparison.csv', asyncRoute(async (request, response) => {
  const evaluation = await evaluationRepository.getById(request.params.id);
  if (!evaluation) return response.status(404).json({ error: { code: 'not_found', message: 'Evaluación no encontrada' } });
  return response.type('text/csv').attachment(`comparativa-${evaluation.id}.csv`).send(buildComparisonCsv(evaluation));
}));

evaluationsRouter.get('/:id/comparison.xlsx', asyncRoute(async (request, response) => {
  const evaluation = await evaluationRepository.getById(request.params.id);
  if (!evaluation) return response.status(404).json({ error: { code: 'not_found', message: 'Evaluación no encontrada' } });
  return response.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .attachment(`comparativa-${evaluation.id}.xlsx`)
    .send(buildComparisonXlsx(evaluation));
}));

evaluationsRouter.patch('/:id/review', requireRole('revisor'), asyncRoute(async (request, response) => {
  const evaluation = await recordHumanReviewUseCase.review({
    evaluationId: request.params.id,
    notes: request.body?.notes ?? '',
    reviewer: request.body?.reviewer ?? 'revisor'
  });
  response.json(evaluation);
}));

evaluationsRouter.post('/:id/approve', requireRole('aprobador'), asyncRoute(async (request, response) => {
  const evaluation = await recordHumanReviewUseCase.approve({
    evaluationId: request.params.id,
    approver: request.body?.approver ?? 'aprobador'
  });
  response.json(evaluation);
}));
