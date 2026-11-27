export class RecordHumanReviewUseCase {
  constructor({ evaluationRepository, eventPublisher }) {
    this.evaluationRepository = evaluationRepository;
    this.eventPublisher = eventPublisher;
  }

  async review({ evaluationId, notes, reviewer }) {
    await this.evaluationRepository.updateReview(evaluationId, { notes, reviewer });
    this.eventPublisher.publish({
      phase: 'review',
      tool: 'human_review',
      message: `Revisión registrada por ${reviewer}`,
      level: 'success'
    });
    return this.evaluationRepository.getById(evaluationId);
  }

  async approve({ evaluationId, approver }) {
    await this.evaluationRepository.approve(evaluationId, approver);
    this.eventPublisher.publish({
      phase: 'approval',
      tool: 'approval',
      message: `Evaluación aprobada por ${approver}`,
      level: 'success'
    });
    return this.evaluationRepository.getById(evaluationId);
  }
}
