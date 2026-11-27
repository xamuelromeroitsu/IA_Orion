import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentRepository, documentStore } from '../../../infrastructure/container.js';
import { documentsRouter } from './documents.routes.js';

vi.mock('../../../infrastructure/container.js', () => ({
  documentRepository: { getById: vi.fn() },
  documentStore: { read: vi.fn() }
}));

describe('GET /api/documents/:id/file', () => {
  const app = express();
  app.use('/api/documents', documentsRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an xlsx document with Excel content type and inline filename', async () => {
    documentRepository.getById.mockResolvedValue({
      id: 'document-id',
      fileName: 'prices.xlsx',
      mime: 'application/octet-stream'
    });
    documentStore.read.mockResolvedValue(Buffer.from('xlsx-content'));

    const response = await request(app).get('/api/documents/document-id/file');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(response.headers['content-disposition']).toBe('inline; filename="prices.xlsx"');
    expect(documentStore.read).toHaveBeenCalledWith(expect.objectContaining({ id: 'document-id' }));
  });
});
