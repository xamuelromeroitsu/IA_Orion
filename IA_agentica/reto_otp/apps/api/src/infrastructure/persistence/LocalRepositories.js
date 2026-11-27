import { localStore } from './LocalStore.js';

export class LocalProjectRepository {
  async list() { return localStore.findAll('projects'); }
  async getById(id) { return localStore.findOne('projects', (item) => item.id === id); }
  async create(project) { return localStore.insert('projects', project); }
  async updateStatus(id, status) { return localStore.update('projects', id, { status, updatedAt: new Date().toISOString() }); }
}

export class LocalDocumentRepository {
  async listByProject(projectId) { return localStore.findAll('documents', (item) => item.projectId === projectId); }
  async getById(id) { return localStore.findOne('documents', (item) => item.id === id); }
  async save(document) { return localStore.insert('documents', document); }
}

export class LocalAnalysisRepository {
  async listByProject(projectId) { return localStore.findAll('analyses', (item) => item.projectId === projectId); }
  async save(analysis) { return localStore.insert('analyses', analysis); }
}

export class LocalEvaluationRepository {
  async list() { return localStore.findAll('evaluations'); }
  async getById(id) { return localStore.findOne('evaluations', (item) => item.id === id); }
  async save(evaluation) { return localStore.insert('evaluations', evaluation); }
  async updateReview(id, { notes, reviewer }) {
    return localStore.update('evaluations', id, { reviewNotes: notes, reviewedBy: reviewer });
  }
  async approve(id, approver) {
    return localStore.update('evaluations', id, { approvedBy: approver });
  }
}

export class LocalChatRepository {
  async listByProject(projectId) { return localStore.findAll('messages', (item) => item.projectId === projectId); }
  async save(message) { return localStore.insert('messages', message); }
}
