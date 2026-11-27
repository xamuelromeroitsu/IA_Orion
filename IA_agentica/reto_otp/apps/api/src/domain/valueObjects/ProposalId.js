import path from 'node:path';

export class ProposalId {
  constructor(value) {
    this.value = String(value ?? '').trim();
    if (!this.value) throw new Error('ProposalId cannot be empty');
  }

  static fromFileName(fileName) {
    return new ProposalId(path.basename(String(fileName ?? ''), path.extname(String(fileName ?? ''))));
  }

  equals(other) {
    return other instanceof ProposalId && other.value === this.value;
  }

  toString() {
    return this.value;
  }
}
