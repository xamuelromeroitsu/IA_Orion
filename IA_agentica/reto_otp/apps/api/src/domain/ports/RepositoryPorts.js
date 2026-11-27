export class ProjectRepositoryPort {
  async list() { throw new Error('ProjectRepositoryPort.list must be implemented'); }
  async getById() { throw new Error('ProjectRepositoryPort.getById must be implemented'); }
  async create() { throw new Error('ProjectRepositoryPort.create must be implemented'); }
  async updateStatus() { throw new Error('ProjectRepositoryPort.updateStatus must be implemented'); }
}

export class DocumentRepositoryPort {
  async listByProject() { throw new Error('DocumentRepositoryPort.listByProject must be implemented'); }
  async save() { throw new Error('DocumentRepositoryPort.save must be implemented'); }
  async getById() { throw new Error('DocumentRepositoryPort.getById must be implemented'); }
}

export class AnalysisRepositoryPort {
  async listByProject() { throw new Error('AnalysisRepositoryPort.listByProject must be implemented'); }
  async save() { throw new Error('AnalysisRepositoryPort.save must be implemented'); }
}

export class EvaluationRepositoryPort {
  async list() { throw new Error('EvaluationRepositoryPort.list must be implemented'); }
  async getById() { throw new Error('EvaluationRepositoryPort.getById must be implemented'); }
  async save() { throw new Error('EvaluationRepositoryPort.save must be implemented'); }
  async updateReview() { throw new Error('EvaluationRepositoryPort.updateReview must be implemented'); }
  async approve() { throw new Error('EvaluationRepositoryPort.approve must be implemented'); }
}

export class ChatRepositoryPort {
  async listByProject() { throw new Error('ChatRepositoryPort.listByProject must be implemented'); }
  async save() { throw new Error('ChatRepositoryPort.save must be implemented'); }
}

export class EventPublisherPort {
  publish() { throw new Error('EventPublisherPort.publish must be implemented'); }
}
