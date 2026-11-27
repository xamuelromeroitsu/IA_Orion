export class EvaluationReport {
  constructor({ id, projectId, ranking = [], comparison = [], summary = '', recommendedId = null, startedAt, finishedAt = null }) {
    this.id = id;
    this.projectId = projectId;
    this.ranking = ranking;
    this.comparison = comparison;
    this.summary = summary;
    this.recommendedId = recommendedId;
    this.startedAt = startedAt;
    this.finishedAt = finishedAt;
  }

  hasUniqueRanking() {
    return new Set(this.ranking).size === this.ranking.length;
  }

  recommendation() {
    return this.comparison.find((row) => row.analysisId === this.recommendedId) ?? null;
  }

  discarded() {
    return this.comparison.filter((row) => row.decision === 'descartada');
  }

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      ranking: this.ranking,
      comparison: this.comparison,
      summary: this.summary,
      recommendedId: this.recommendedId,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt
    };
  }
}
