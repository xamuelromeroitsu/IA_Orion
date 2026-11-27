import { EventPublisherPort } from '../../domain/ports/RepositoryPorts.js';

export class SseEventBus extends EventPublisherPort {
  constructor() {
    super();
    this.streams = new Map();
    this.history = new Map();
  }

  subscribe(evaluationId, response) {
    if (!this.streams.has(evaluationId)) this.streams.set(evaluationId, new Set());
    this.streams.get(evaluationId).add(response);
    for (const event of this.history.get(evaluationId) ?? []) {
      response.write(`event: trace\ndata: ${JSON.stringify(event)}\n\n`);
    }
    return () => this.streams.get(evaluationId)?.delete(response);
  }

  publish(event) {
    const enriched = { at: new Date().toISOString(), ...event };
    if (event.evaluationId) {
      if (!this.history.has(event.evaluationId)) this.history.set(event.evaluationId, []);
      this.history.get(event.evaluationId).push(enriched);
    }
    for (const stream of this.streams.values()) {
      for (const response of stream) {
        response.write(`event: trace\ndata: ${JSON.stringify(enriched)}\n\n`);
      }
    }
    return enriched;
  }

  close(evaluationId) {
    for (const response of this.streams.get(evaluationId) ?? []) response.end();
    this.streams.delete(evaluationId);
  }
}
