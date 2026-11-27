import { randomUUID } from 'node:crypto';
import { validateArithmetic } from '../../domain/rules/arithmetic.js';
import { checkScope } from '../../domain/rules/scopeCheck.js';
import { evaluateDiscard } from '../../domain/rules/discard.js';
import { computeTco } from '../../domain/rules/tco.js';
import { rankAnalyses } from '../../domain/rules/ranking.js';

export class EvaluateBatchUseCase {
  constructor({
    analysisRepository,
    evaluationRepository,
    projectRepository,
    eventPublisher,
    exchangeRatePort,
    marketPricePort
  }) {
    this.analysisRepository = analysisRepository;
    this.evaluationRepository = evaluationRepository;
    this.projectRepository = projectRepository;
    this.eventPublisher = eventPublisher;
    this.exchangeRatePort = exchangeRatePort;
    this.marketPricePort = marketPricePort;
  }

  async execute({ projectId, evaluationId = randomUUID(), eventPublisher = this.eventPublisher }) {
    const startedAt = new Date().toISOString();
    eventPublisher.publish({
      phase: 'evaluation',
      tool: 'evaluator',
      message: 'Iniciando evaluación comparativa',
      level: 'info'
    });

    const analyses = await this.analysisRepository.listByProject(projectId);
    if (analyses.length === 0) {
      throw new Error('No hay documentos analizados para evaluar');
    }

    const project = await this.projectRepository.getById(projectId);
    const rate = await this.exchangeRatePort.getRate();
    const evaluations = [];

    for (const analysis of analyses) {
      eventPublisher.publish({
        phase: 'evaluation',
        tool: 'calculator',
        message: `Recalculando ${analysis.fileName}`,
        level: 'info'
      });
      const arithmetic = validateArithmetic(analysis.items ?? [], analysis.declaredTotal, analysis.id);
      const scope = checkScope(analysis, project);
      const discard = evaluateDiscard(analysis, arithmetic, scope);
      const tco = computeTco(analysis, rate.rateUsd);
      const hiddenCostsUsd = tco.hiddenCostsUsd().toNumber();
      const tcoUsd = tco.totalUsd().toNumber();

      let marketFindings = [];
      const marketQueries = (analysis.items ?? []).slice(0, 2).map((item) => item.description);
      if (marketQueries.length > 0) {
        eventPublisher.publish({
          phase: 'evaluation',
          tool: 'web_search',
          message: `Contrastando precios de mercado para ${analysis.supplier}`,
          level: 'info'
        });
        const references = await this.marketPricePort.search(marketQueries);
        marketFindings = references.map((reference, index) => ({
          id: `${analysis.id}_market_${index}`,
          category: 'market_price',
          severity: 'low',
          title: `Referencia de mercado: ${reference.title}`,
          detail: reference.snippet,
          evidence: reference.url,
          amountImpactUsd: 0,
          sourceUrl: reference.url
        }));
      }

      evaluations.push({
        analysisId: analysis.id,
        tcoUsd,
        hiddenCostsUsd,
        declaredTotalUsd: analysis.declaredTotal,
        isDiscarded: discard.isDiscarded,
        reasons: discard.reasons,
        findings: [...discard.findings, ...marketFindings]
      });
    }

    const ranked = rankAnalyses(analyses, evaluations);
    const finishedAt = new Date().toISOString();
    const evaluation = {
      id: evaluationId,
      projectId,
      status: 'completed',
      startedAt,
      finishedAt,
      ranking: ranked.ranking,
      comparison: ranked.rows,
      summary: ranked.summary,
      recommendedId: ranked.recommendedId,
      exchangeRate: rate.rateUsd,
      exchangeRateDate: rate.effectiveDate,
      reviewedBy: null,
      reviewNotes: null,
      approvedBy: null
    };

    await this.evaluationRepository.save(evaluation);
    await this.projectRepository.updateStatus(projectId, 'revision_comite');
    eventPublisher.publish({
      phase: 'done',
      tool: 'ranking',
      message: `Ranking determinista listo: ${ranked.ranking.length} propuestas ordenadas`,
      level: 'success'
    });

    return evaluation;
  }
}
