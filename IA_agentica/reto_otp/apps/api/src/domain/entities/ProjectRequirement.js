export const defaultRequiredItems = [
  'gabinete',
  'monitor',
  'teclado',
  'raton',
  'protector electrico',
  'entrega',
  'instalacion',
  'garantia'
];

export class ProjectRequirement {
  constructor({
    id,
    name,
    description = '',
    location = 'Caracas, Venezuela',
    budgetReferenceUsd = 0,
    status = 'recepcion',
    requiredTeams = 11,
    requiredItems = defaultRequiredItems,
    createdAt = new Date().toISOString(),
    updatedAt = createdAt
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.location = location;
    this.budgetReferenceUsd = budgetReferenceUsd;
    this.status = status;
    this.requiredTeams = requiredTeams;
    this.requiredItems = requiredItems;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromRecord(record) {
    if (!record) return null;
    return new ProjectRequirement({
      id: record.id,
      name: record.name,
      description: record.description ?? '',
      location: record.location ?? 'Caracas, Venezuela',
      budgetReferenceUsd: Number(record.budget_reference_usd ?? record.budgetReferenceUsd ?? 0),
      status: record.status ?? 'recepcion',
      createdAt: record.created_at ?? record.createdAt,
      updatedAt: record.updated_at ?? record.updatedAt
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      location: this.location,
      budgetReferenceUsd: this.budgetReferenceUsd,
      status: this.status,
      requiredTeams: this.requiredTeams,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
