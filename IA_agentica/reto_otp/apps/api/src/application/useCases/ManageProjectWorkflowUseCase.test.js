import { describe, expect, it, vi } from 'vitest';
import { ManageProjectWorkflowUseCase } from './ManageProjectWorkflowUseCase.js';

describe('ManageProjectWorkflowUseCase', () => {
  it('requires operation and business type when creating a project', async () => {
    const projectRepository = { create: vi.fn() };
    const useCase = new ManageProjectWorkflowUseCase({
      projectRepository,
      eventPublisher: { publish: vi.fn() }
    });

    await expect(useCase.createProject({ name: 'Compra comercial' }))
      .rejects.toMatchObject({ status: 400, code: 'invalid_project_context' });
    expect(projectRepository.create).not.toHaveBeenCalled();
  });

  it('stores the project operation and business type', async () => {
    const projectRepository = { create: vi.fn() };
    const useCase = new ManageProjectWorkflowUseCase({
      projectRepository,
      eventPublisher: { publish: vi.fn() }
    });

    const project = await useCase.createProject({
      name: 'Compra de celulares',
      operationType: 'compra',
      businessType: '  Celulares  '
    });

    expect(project).toMatchObject({ operationType: 'compra', businessType: 'Celulares' });
    expect(projectRepository.create).toHaveBeenCalledWith(project);
  });
});
