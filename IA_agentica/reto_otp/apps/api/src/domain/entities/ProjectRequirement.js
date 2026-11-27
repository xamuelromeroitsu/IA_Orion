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
    operationType = 'compra',
    businessType = '',
    location = 'Caracas, Venezuela',
    budgetReferenceUsd = 0,
    status = 'recepcion',
    requiredTeams,
    requiredItems,
    createdAt = new Date().toISOString(),
    updatedAt = createdAt
  }) {
    const usesComputerScope = !businessType || /comput|laboratorio|laptops?|estaciones de trabajo|\bpcs?\b/i.test(businessType);
    this.id = id;
    this.name = name;
    this.description = description;
    this.operationType = operationType;
    this.businessType = businessType;
    this.location = location;
    this.budgetReferenceUsd = budgetReferenceUsd;
    this.status = status;
    this.requiredTeams = requiredTeams ?? (usesComputerScope ? 11 : null);
    this.requiredItems = requiredItems ?? (usesComputerScope ? defaultRequiredItems : []);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromRecord(record) {
    if (!record) return null;
    return new ProjectRequirement({
      id: record.id,
      name: record.name,
      description: record.description ?? '',
      operationType: record.operation_type ?? record.operationType ?? 'compra',
      businessType: record.business_type ?? record.businessType ?? '',
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
      operationType: this.operationType,
      businessType: this.businessType,
      location: this.location,
      budgetReferenceUsd: this.budgetReferenceUsd,
      status: this.status,
      requiredTeams: this.requiredTeams,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
