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

  it('constrains Gemini enum fields to values accepted by the analysis contract', async () => {
    const auditor = new GeminiAuditor({
      apiKey: 'test-key',
      extractionModel: 'test-model',
      fallback: { analyze: vi.fn() }
    });
    const result = {
      supplier: 'Proveedor',
      isAnalyzable: true,
      analysisIssue: '',
      isLegalDocument: false,
      legalEvidence: '',
      suspiciousFraud: false,
      fraudEvidence: '',
      currency: 'USD',
      declaredTotal: 100,
      items: [],
      hiddenCosts: [],
      warrantyMonths: 0,
      scopeComplete: true,
      injectionDetected: false,
      summary: 'Propuesta analizada.',
      conclusion: 'Conclusión.',
      pros: [],
      cons: [],
      finePrint: [],
      findings: [{
        category: 'general',
        severity: 'low',
        title: 'Hallazgo',
        detail: 'Detalle',
        evidence: 'Evidencia'
      }],
      confidence: 0.9
    };
    const generateContent = vi.fn().mockResolvedValue({ text: JSON.stringify(result) });
    auditor.client = { models: { generateContent } };

    await auditor.analyze({
      fileName: 'propuesta.pdf',
      mimeType: 'application/pdf',
      kind: 'pdf',
      text: 'Contenido extraído de la propuesta.',
      sheets: []
    });

    const responseSchema = generateContent.mock.calls[0][0].config.responseSchema;
    expect(responseSchema.properties.currency.enum).toEqual(['USD', 'VES']);
    expect(responseSchema.properties.findings.items.properties.category.enum).toEqual([
      'arithmetic', 'hidden_cost', 'injection', 'scope', 'compatibility', 'market_price', 'warranty', 'general'
    ]);
    expect(responseSchema.properties.findings.items.properties.severity.enum).toEqual([
      'low', 'medium', 'high', 'critical'
    ]);
  });
});
