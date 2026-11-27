import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { dataDirectory } from '../persistence/LocalStore.js';

const filesDirectory = path.join(dataDirectory, 'files');

function storageError(message, cause, code) {
  const error = new Error(message, { cause });
  error.status = 500;
  if (code) error.code = code;
  return error;
}

function createKey(aesKey) {
  if (aesKey) {
    const decoded = Buffer.from(aesKey, 'base64');
    if (decoded.length === 32) return decoded;
  }
  return crypto.createHash('sha256').update('orion-demo-key').digest();
}

export class DocumentStore {
  constructor({ client, aesKey, bucket = 'documents', logger } = {}) {
    this.client = client;
    this.key = createKey(aesKey);
    this.bucket = bucket;
    this.logger = logger;
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
      const { error } = await this.client.storage.from(this.bucket).upload(storagePath, ciphertext, {
        contentType: 'application/octet-stream',
        upsert: true
      });
      if (error) {
        throw storageError(`No se pudo guardar el archivo cifrado: ${storagePath}`, error, 'document_storage_save_failed');
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
    let ciphertext;
    if (this.client && document.storagePath) {
      const { data, error } = await this.client.storage.from(this.bucket).download(document.storagePath);
      if (error) {
        throw storageError(`No se pudo descargar el archivo cifrado: ${document.id}`, error);
      }
      if (!data) throw storageError(`No se encontró el archivo cifrado: ${document.id}`);
      ciphertext = Buffer.from(await data.arrayBuffer());
    } else {
      try {
        ciphertext = await fs.readFile(document.localPath ?? path.join(filesDirectory, `${document.id}.bin`));
      } catch (error) {
        throw storageError(`No se pudo leer el archivo cifrado: ${document.id}`, error);
      }
    }

    const iv = Buffer.isBuffer(document.iv) ? document.iv : Buffer.from(document.iv ?? '', 'base64');
    const tag = Buffer.isBuffer(document.tag) ? document.tag : Buffer.from(document.tag ?? '', 'base64');
    this.logger?.info({
      documentId: document.id,
      ivPresent: iv.length > 0,
      ivBytes: iv.length,
      tagBytes: tag.length,
      mime: document.mime,
      storagePath: document.storagePath
    }, 'Descifrando documento');

    if (iv.length !== 12 || tag.length !== 16) {
      const error = new Error(`Metadatos de cifrado inválidos para el documento ${document.id}`);
      error.status = 500;
      throw error;
    }

    try {
      return this.decrypt(ciphertext, iv, tag);
    } catch (error) {
      error.status = 500;
      throw error;
    }
  }
}
