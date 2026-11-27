export class AiAuditorPort {
  async analyze() {
    throw new Error('AiAuditorPort.analyze must be implemented');
  }

  async ask() {
    throw new Error('AiAuditorPort.ask must be implemented');
  }
}
