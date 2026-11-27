import { describe, expect, it, vi } from 'vitest';
import { AnalyzeDocumentUseCase } from './AnalyzeDocumentUseCase.js';

describe('AnalyzeDocumentUseCase', () => {
  it('does not persist an analysis when the auditor cannot read the document', async () => {
    const analysisRepository = { save: vi.fn() };
    const useCase = new AnalyzeDocumentUseCase({
      aiAuditor: {
        analyze: vi.fn().mockResolvedValue({
          supplier: '',
          isAnalyzable: false,
          analysisIssue: 'El documento está borroso',
          isLegalDocument: false,
          legalEvidence: '',
          suspiciousFraud: false,
          fraudEvidence: '',
          currency: 'USD',
          declaredTotal: 0,
          items: [],
          hiddenCosts: [],
          warrantyMonths: 0,
          scopeComplete: false,
          injectionDetected: false,
          summary: '',
          conclusion: '',
          pros: [],
          cons: [],
          finePrint: [],
          findings: [],
          confidence: 0
        })
      },
      analysisRepository,
      eventPublisher: { publish: vi.fn() },
      exchangeRatePort: { getRate: vi.fn() }
    });

    await expect(useCase.execute({
      projectId: 'project-1',
      document: { id: 'document-1', fileName: 'ilegible.pdf', mime: 'application/pdf', extractedText: '' },
      requirement: { operationType: 'compra', businessType: 'celulares' }
    })).rejects.toMatchObject({ status: 422, code: 'document_not_analyzable' });
    expect(analysisRepository.save).not.toHaveBeenCalled();
  });

  it('omits unsupported fine print and hidden costs from a normal price list', async () => {
    const analysisRepository = { save: vi.fn() };
    const useCase = new AnalyzeDocumentUseCase({
      aiAuditor: {
        source: 'gemini',
        analyze: vi.fn().mockResolvedValue({
          supplier: 'Proveedor',
          isAnalyzable: true,
          analysisIssue: '',
          isLegalDocument: false,
          legalEvidence: '',
          suspiciousFraud: false,
          fraudEvidence: '',
          currency: 'USD',
          declaredTotal: 200,
          items: [],
          hiddenCosts: ['Pago adicional de transporte'],
          warrantyMonths: 0,
          scopeComplete: true,
          injectionDetected: false,
          summary: 'Lista de precios.',
          conclusion: 'Precios unitarios.',
          pros: [],
          cons: [],
          finePrint: ['Pago adicional de transporte'],
          findings: [],
          confidence: 0.9
        })
      },
      analysisRepository,
      eventPublisher: { publish: vi.fn() },
      exchangeRatePort: { getRate: vi.fn().mockResolvedValue({ rateUsd: 1 }) }
    });

    const analysis = await useCase.execute({
      projectId: 'project-1',
      document: {
        id: 'document-2',
        fileName: 'precios.xlsx',
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extractedText: 'Lista de precios de celulares: total 200 USD.'
      },
      requirement: { operationType: 'compra', businessType: 'celulares' }
    });

    expect(analysis.finePrint).toEqual([]);
    expect(analysis.hiddenCosts).toEqual([]);
  });

  it('analyzes every spreadsheet item as one unit and marks its unit price against project budget', async () => {
    const useCase = new AnalyzeDocumentUseCase({
      aiAuditor: {
        analyze: vi.fn().mockResolvedValue({
          supplier: 'Catálogo',
          isAnalyzable: true,
          analysisIssue: '',
          isLegalDocument: false,
          legalEvidence: '',
          suspiciousFraud: false,
          fraudEvidence: '',
          currency: 'USD',
          declaredTotal: 12500,
          items: [
            { description: 'Teléfono', qty: 50, unitPrice: 250 },
            { description: 'Tableta', qty: 25, unitPrice: 800 }
          ],
          hiddenCosts: [],
          warrantyMonths: 0,
          scopeComplete: true,
          injectionDetected: false,
          summary: 'Total inventariado 12500.',
          conclusion: 'Conclusión',
          pros: [],
          cons: [],
          finePrint: [],
          findings: [],
          confidence: 0.9
        })
      },
      analysisRepository: { save: vi.fn() },
      eventPublisher: { publish: vi.fn() },
      exchangeRatePort: { getRate: vi.fn().mockResolvedValue({ rateUsd: 1 }) }
    });

    const analysis = await useCase.execute({
      projectId: 'project-1',
      document: {
        id: 'document-3',
        fileName: 'catalogo.xlsx',
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        kind: 'spreadsheet',
        extractedText: 'Teléfono $250; tableta $800.'
      },
      requirement: { operationType: 'compra', businessType: 'celulares', budgetReferenceUsd: 500 }
    });

    expect(analysis.items.map((item) => item.qty)).toEqual([1, 1]);
    expect(analysis.items.map((item) => item.withinBudget)).toEqual([true, false]);
    expect(analysis.declaredTotal).toBe(1050);
    expect(analysis.summary).toContain('cantidades de inventario no se suman');
  });
});
