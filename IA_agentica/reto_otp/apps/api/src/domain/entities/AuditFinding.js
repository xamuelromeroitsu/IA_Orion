export class AuditFinding {
  constructor({ id, category = 'general', severity = 'low', title, detail, evidence = '', amountImpactUsd = 0, sourceUrl = null }) {
    this.id = id;
    this.category = category;
    this.severity = severity;
    this.title = title;
    this.detail = detail;
    this.evidence = evidence;
    this.amountImpactUsd = amountImpactUsd;
    this.sourceUrl = sourceUrl;
  }

  toJSON() {
    return {
      id: this.id,
      category: this.category,
      severity: this.severity,
      title: this.title,
      detail: this.detail,
      evidence: this.evidence,
      amountImpactUsd: this.amountImpactUsd,
      sourceUrl: this.sourceUrl
    };
  }
}
