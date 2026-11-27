import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalDocumentRepository } from './LocalRepositories.js';
import { SupabaseDocumentRepository } from './SupabaseRepositories.js';

describe('SupabaseDocumentRepository', () => {
  afterEach(() => vi.restoreAllMocks());

  it('falls back to the local record when Supabase returns no matching row', async () => {
    const localDocument = { id: 'document-id', fileName: 'prices.xlsx' };
    vi.spyOn(LocalDocumentRepository.prototype, 'getById').mockResolvedValue(localDocument);
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const client = { from: vi.fn(() => ({ select })) };
    const repository = new SupabaseDocumentRepository(client);

    await expect(repository.getById(localDocument.id)).resolves.toBe(localDocument);
    expect(client.from).toHaveBeenCalledWith('project_documents');
    expect(eq).toHaveBeenCalledWith('id', localDocument.id);
  });

  it('surfaces failed Supabase inserts instead of silently reporting a saved document', async () => {
    const document = { id: 'document-id', projectId: 'project-id', fileName: 'prices.xlsx' };
    vi.spyOn(LocalDocumentRepository.prototype, 'save').mockResolvedValue(document);
    const insert = vi.fn().mockResolvedValue({ error: { code: '42501' } });
    const client = { from: vi.fn(() => ({ insert })) };
    const repository = new SupabaseDocumentRepository(client);

    await expect(repository.save(document)).rejects.toMatchObject({
      status: 500,
      code: 'document_record_save_failed'
    });
    expect(insert).toHaveBeenCalledOnce();
  });
});
