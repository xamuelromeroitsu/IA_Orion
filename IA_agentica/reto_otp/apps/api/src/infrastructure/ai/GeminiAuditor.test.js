import { describe, expect, it, vi } from 'vitest';
import { GeminiAuditor } from './GeminiAuditor.js';

describe('GeminiAuditor', () => {
  it('rejects a document with no text, spreadsheet data, or visual input', async () => {
    const fallback = { analyze: vi.fn() };
    const auditor = new GeminiAuditor({
      apiKey: 'test-key',
      extractionModel: 'test-model',
      fallback
    });

    await expect(auditor.analyze({
      fileName: 'ilegible.pdf',
      mimeType: 'application/pdf',
      text: '',
      sheets: []
    })).rejects.toMatchObject({ status: 422, code: 'document_not_analyzable' });
    expect(fallback.analyze).not.toHaveBeenCalled();
  });

  it('does not fabricate a deterministic result when visual analysis fails', async () => {
    const fallback = { analyze: vi.fn() };
    const auditor = new GeminiAuditor({
      apiKey: 'test-key',
      extractionModel: 'test-model',
      fallback,
      inlineData: 'base64-image'
    });
    auditor.client = {
      models: { generateContent: vi.fn().mockRejectedValue(new Error('vision unavailable')) }
    };

    await expect(auditor.analyze({
      fileName: 'borroso.png',
      mimeType: 'image/png',
      text: '',
      sheets: []
    })).rejects.toMatchObject({ status: 422, code: 'document_not_analyzable' });
    expect(fallback.analyze).not.toHaveBeenCalled();
  });
});
