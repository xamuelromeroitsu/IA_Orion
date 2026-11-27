import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  documentRepository,
  documentStore,
  manageProjectWorkflowUseCase
} from '../../../infrastructure/container.js';
import { projectsRouter } from './projects.routes.js';

vi.mock('../../../infrastructure/config.js', () => ({
  env: {
    ALLOWED_MIME: 'application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    MAX_PROPOSALS: 20
  },
  supabaseKey: ''
}));

vi.mock('../../../infrastructure/container.js', () => ({
  analysisRepository: {},
  createAuditor: vi.fn(() => ({})),
  documentRepository: { save: vi.fn() },
  documentStore: {
    save: vi.fn(async ({ fileName }) => ({ id: fileName, storagePath: fileName, sha256: 'hash', iv: 'iv', tag: 'tag' }))
  },
  eventBus: {},
  exchangeRatePort: {},
  manageProjectWorkflowUseCase: {
    getProject: vi.fn(async (id) => ({ id })),
    updateStatus: vi.fn()
  }
}));

vi.mock('../../../infrastructure/parsing/TextExtractor.js', () => ({
  extractDocument: vi.fn(async ({ fileName }) => ({
    kind: fileName.endsWith('.png') ? 'image' : 'spreadsheet',
    extractedText: '',
    sheets: [],
    calculatedTotal: 0
  }))
}));

vi.mock('../../../application/useCases/AnalyzeDocumentUseCase.js', () => ({
  AnalyzeDocumentUseCase: class {
    async execute({ document }) {
      if (document.kind === 'image') {
        const error = new Error('El análisis visual requiere GEMINI_API_KEY');
        error.status = 503;
        error.code = 'image_analysis_unavailable';
        throw error;
      }
      return { id: `analysis-${document.id}`, documentId: document.id };
    }
  }
}));

vi.mock('../../middleware/auth.js', () => ({
  requireRole: () => (_request, _response, next) => next()
}));

describe('POST /api/projects/:id/documents', () => {
  const app = express();
  app.use('/api/projects', projectsRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps failed image uploads accessible and continues analyzing the remaining files', async () => {
    const response = await request(app)
      .post('/api/projects/project-id/documents')
      .attach('files', Buffer.from('png-file'), { filename: 'proposal.png', contentType: 'image/png' })
      .attach('files', Buffer.from('xlsx-file'), {
        filename: 'prices.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    expect(response.status).toBe(201);
    expect(response.body.documents.map((document) => document.fileName)).toEqual(['proposal.png', 'prices.xlsx']);
    expect(response.body.analyses).toEqual([
      expect.objectContaining({ documentId: 'prices.xlsx' })
    ]);
    expect(response.body.analysisErrors).toEqual([
      expect.objectContaining({
        documentId: 'proposal.png',
        fileName: 'proposal.png',
        code: 'image_analysis_unavailable'
      })
    ]);
    expect(response.body.uploadErrors).toEqual([]);
    expect(documentRepository.save).toHaveBeenCalledTimes(2);
    expect(documentStore.save).toHaveBeenCalledTimes(2);
    expect(manageProjectWorkflowUseCase.updateStatus).toHaveBeenCalledWith('project-id', 'evaluacion');
  });

  it('reports an individual storage failure and continues with the remaining files', async () => {
    documentStore.save.mockRejectedValueOnce(Object.assign(
      new Error('No se pudo guardar el archivo cifrado'),
      { code: 'document_storage_save_failed' }
    ));

    const response = await request(app)
      .post('/api/projects/project-id/documents')
      .attach('files', Buffer.from('png-file'), { filename: 'proposal.png', contentType: 'image/png' })
      .attach('files', Buffer.from('xlsx-file'), {
        filename: 'prices.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    expect(response.status).toBe(201);
    expect(response.body.documents.map((document) => document.fileName)).toEqual(['prices.xlsx']);
    expect(response.body.analyses).toEqual([
      expect.objectContaining({ documentId: 'prices.xlsx' })
    ]);
    expect(response.body.uploadErrors).toEqual([
      expect.objectContaining({
        fileName: 'proposal.png',
        code: 'document_storage_save_failed'
      })
    ]);
    expect(documentRepository.save).toHaveBeenCalledTimes(1);
    expect(documentStore.save).toHaveBeenCalledTimes(2);
  });
});
