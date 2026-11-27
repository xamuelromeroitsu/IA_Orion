export class VendorProfile {
  constructor({ fiscalId, name, location = '', contact = '', history = [] }) {
    this.fiscalId = fiscalId;
    this.name = name;
    this.location = location;
    this.contact = contact;
    this.history = history;
  }

  hasRepeatedFindings() {
    return this.history.filter((entry) => entry.severity === 'high' || entry.severity === 'critical').length >= 2;
  }

  toJSON() {
    return {
      fiscalId: this.fiscalId,
      name: this.name,
      location: this.location,
      contact: this.contact,
      history: this.history
    };
  }
}
