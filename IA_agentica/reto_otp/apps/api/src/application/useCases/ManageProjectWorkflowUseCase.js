import { randomUUID } from 'node:crypto';

export class ManageProjectWorkflowUseCase {
  constructor({ projectRepository, eventPublisher }) {
    this.projectRepository = projectRepository;
    this.eventPublisher = eventPublisher;
  }

  async listProjects() {
    return this.projectRepository.list();
  }

  async getProject(projectId) {
    const project = await this.projectRepository.getById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');
    return project;
  }

  async createProject(input) {
    const now = new Date().toISOString();
    const project = {
      id: randomUUID(),
      name: input.name,
      description: input.description ?? '',
      location: input.location ?? 'Caracas, Venezuela',
      budgetReferenceUsd: Number(input.budgetReferenceUsd ?? 0),
      status: 'recepcion',
      createdAt: now,
      updatedAt: now
    };
    await this.projectRepository.create(project);
    this.eventPublisher.publish({
      phase: 'project',
      tool: 'project_created',
      message: `Proyecto creado: ${project.name}`,
      level: 'success'
    });
    return project;
  }

  async updateStatus(projectId, status) {
    await this.projectRepository.updateStatus(projectId, status);
    return this.getProject(projectId);
  }
}
