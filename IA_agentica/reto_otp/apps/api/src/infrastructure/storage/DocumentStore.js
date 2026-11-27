import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { dataDirectory } from '../persistence/LocalStore.js';

const filesDirectory = path.join(dataDirectory, 'files');

function createKey(aesKey) {
  if (aesKey) {
    const decoded = Buffer.from(aesKey, 'base64');
    if (decoded.length === 32) return decoded;
  }
  return crypto.createHash('sha256').update('orion-demo-key').digest();
}

export class DocumentStore {
  constructor({ client, aesKey, bucket = 'documents' } = {}) {
    this.client = client;
    this.key = createKey(aesKey);
    this.bucket = bucket;
  }

  encrypt(buffer) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return { ciphertext: encrypted, iv, tag: cipher.getAuthTag() };
  }

  decrypt(ciphertext, iv, tag) {
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  async save({ buffer, fileName, projectId }) {
    await fs.mkdir(filesDirectory, { recursive: true });
    const id = crypto.randomUUID();
    const { ciphertext, iv, tag } = this.encrypt(buffer);
    const safeName = String(fileName ?? 'documento').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
    const storagePath = `${projectId}/${id}_${safeName}.bin`;
    const localPath = path.join(filesDirectory, `${id}.bin`);
    await fs.writeFile(localPath, ciphertext);
    if (this.client) {
      try {
        await this.client.storage.from(this.bucket).upload(storagePath, ciphertext, {
          contentType: 'application/octet-stream',
          upsert: true
        });
      } catch {
        this.client = null;
      }
    }
    return {
      id,
      storagePath,
      localPath,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  }

  async read(document) {
    const ciphertext = await fs.readFile(document.localPath ?? path.join(filesDirectory, `${document.id}.bin`));
    const iv = Buffer.isBuffer(document.iv) ? document.iv : Buffer.from(document.iv ?? '', 'base64');
    const tag = Buffer.isBuffer(document.tag) ? document.tag : Buffer.from(document.tag ?? '', 'base64');
    return this.decrypt(ciphertext, iv, tag);
  }
}
