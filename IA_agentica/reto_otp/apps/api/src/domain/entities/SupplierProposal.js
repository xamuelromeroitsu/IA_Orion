import { Money } from '../valueObjects/Money.js';
import { ProposalId } from '../valueObjects/ProposalId.js';

export class SupplierProposal {
  constructor({
    id,
    supplier,
    items = [],
    declaredTotal = 0,
    currency = 'USD',
    hiddenCosts = [],
    warrantyMonths = 0,
    scopeComplete = true,
    injectionDetected = false,
    source = 'deterministic',
    confidence = 0.5
  }) {
    this.id = id instanceof ProposalId ? id : new ProposalId(id);
    this.supplier = supplier || 'Proveedor sin identificar';
    this.items = items;
    this.declaredTotal = new Money(declaredTotal, currency);
    this.hiddenCosts = hiddenCosts;
    this.warrantyMonths = warrantyMonths;
    this.scopeComplete = scopeComplete;
    this.injectionDetected = injectionDetected;
    this.source = source;
    this.confidence = confidence;
  }

  calculatedTotal() {
    return this.items.reduce(
      (total, item) => total.plus(new Money(item.calculatedSubtotal ?? item.qty * item.unitPrice, this.declaredTotal.currency)),
      Money.zero(this.declaredTotal.currency)
    );
  }

  toJSON() {
    return {
      id: this.id.toString(),
      supplier: this.supplier,
      items: this.items,
      declaredTotal: this.declaredTotal.toNumber(),
      calculatedTotal: this.calculatedTotal().toNumber(),
      currency: this.declaredTotal.currency,
      hiddenCosts: this.hiddenCosts,
      warrantyMonths: this.warrantyMonths,
      scopeComplete: this.scopeComplete,
      injectionDetected: this.injectionDetected,
      source: this.source,
      confidence: this.confidence
    };
  }
}
