import { MarketPricePort } from '../../domain/ports/MarketPricePort.js';

export class WebPriceProvider extends MarketPricePort {
  constructor({ apiKey = '', maxResults = 3 } = {}) {
    super();
    this.apiKey = apiKey;
    this.maxResults = maxResults;
    this.cache = new Map();
  }

  async search(queries = []) {
    if (!this.apiKey) return [];
    const results = [];
    for (const query of queries.slice(0, 2)) {
      if (this.cache.has(query)) {
        results.push(...this.cache.get(query));
        continue;
      }
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            api_key: this.apiKey,
            query: `${query} precio Venezuela`,
            search_depth: 'basic',
            max_results: this.maxResults
          }),
          signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) continue;
        const payload = await response.json();
        const references = (payload.results ?? []).map((item) => ({
          title: item.title ?? query,
          url: item.url ?? '',
          snippet: item.content ?? '',
          fetchedAt: new Date().toISOString().slice(0, 10)
        })).filter((item) => item.url);
        this.cache.set(query, references);
        results.push(...references);
      } catch {
        this.cache.set(query, []);
      }
    }
    return results;
  }
}
