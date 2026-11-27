import { describe, expect, it, vi } from 'vitest';
import { DocumentStore } from './DocumentStore.js';
import { SupabaseDocumentRepository } from '../persistence/SupabaseRepositories.js';

describe('DocumentStore', () => {
  it('descarga y descifra documentos de Supabase con sus metadatos base64', async () => {
    const store = new DocumentStore();
    const plaintext = Buffer.from('contenido del PDF');
    const { ciphertext, iv, tag } = store.encrypt(plaintext);
    const download = vi.fn().mockResolvedValue({
      data: new Blob([ciphertext]),
      error: null
    });
    const client = { storage: { from: () => ({ download }) } };
    const logger = { info: vi.fn() };
    const remoteStore = new DocumentStore({ client, logger });

    const result = await remoteStore.read({
      id: 'document-id',
      fileName: 'propuesta.pdf',
      mime: 'application/pdf',
      storagePath: 'project/document.bin',
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    });

    expect(result).toEqual(plaintext);
    expect(download).toHaveBeenCalledWith('project/document.bin');
    expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({
      ivPresent: true,
      ivBytes: 12,
      tagBytes: 16,
      mime: 'application/pdf'
    }), 'Descifrando documento');
  });

  it('rechaza metadatos IV inválidos de forma explícita', async () => {
    const client = {
      storage: {
        from: () => ({
          download: async () => ({ data: new Blob([Buffer.from('ciphertext')]), error: null })
        })
      }
    };
    const store = new DocumentStore({ client });

    await expect(store.read({
      id: 'document-id',
      storagePath: 'project/document.bin',
      iv: '',
      tag: Buffer.alloc(16).toString('base64')
    })).rejects.toMatchObject({ status: 500, message: expect.stringContaining('Metadatos de cifrado inválidos') });
  });
});

describe('SupabaseDocumentRepository', () => {
  it('incluye IV y tag al recuperar un documento', async () => {
    const record = {
      id: 'document-id',
      project_id: 'project-id',
      file_name: 'propuesta.pdf',
      mime: 'application/pdf',
      kind: 'pdf',
      size_bytes: 10,
      storage_path: 'project/document.bin',
      iv: 'aXY=',
      tag: 'dGFn',
      created_at: '2026-01-01T00:00:00.000Z'
    };
    const maybeSingle = vi.fn().mockResolvedValue({ data: record, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const client = { from: vi.fn(() => ({ select })) };
    const repository = new SupabaseDocumentRepository(client);

    const document = await repository.getById(record.id);

    expect(document.iv).toBe(record.iv);
    expect(document.tag).toBe(record.tag);
    expect(select).toHaveBeenCalledWith(expect.stringContaining('iv,tag'));
  });
});
