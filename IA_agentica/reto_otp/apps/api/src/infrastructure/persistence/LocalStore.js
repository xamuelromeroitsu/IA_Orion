import fs from 'node:fs/promises';
import path from 'node:path';

const dataDirectory = path.resolve(process.cwd(), '.data');
const storePath = path.join(dataDirectory, 'store.json');

function emptyStore() {
  return { projects: [], documents: [], analyses: [], evaluations: [], chats: [], messages: [] };
}

export class LocalStore {
  constructor() {
    this.state = emptyStore();
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    try {
      const raw = await fs.readFile(storePath, 'utf8');
      this.state = { ...emptyStore(), ...JSON.parse(raw) };
    } catch {
      this.state = emptyStore();
    }
    this.loaded = true;
  }

  async save() {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  async insert(collection, record) {
    await this.load();
    const index = this.state[collection].findIndex((item) => item.id === record.id);
    if (index >= 0) this.state[collection][index] = record;
    else this.state[collection].push(record);
    await this.save();
    return record;
  }

  async findAll(collection, predicate = () => true) {
    await this.load();
    return this.state[collection].filter(predicate);
  }

  async findOne(collection, predicate) {
    await this.load();
    return this.state[collection].find(predicate) ?? null;
  }

  async update(collection, id, patch) {
    await this.load();
    const index = this.state[collection].findIndex((item) => item.id === id);
    if (index < 0) return null;
    this.state[collection][index] = { ...this.state[collection][index], ...patch };
    await this.save();
    return this.state[collection][index];
  }
}

export const localStore = new LocalStore();
export { dataDirectory };
