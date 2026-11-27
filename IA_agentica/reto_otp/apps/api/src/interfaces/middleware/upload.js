import multer from 'multer';
import { allowedMime, maxUploadBytes } from '@orion/shared';
import { env } from '../../infrastructure/config.js';

const configuredMime = env.ALLOWED_MIME.split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const acceptedMime = configuredMime.length > 0 ? configuredMime : allowedMime;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes, files: env.MAX_PROPOSALS },
  fileFilter(_request, file, callback) {
    if (acceptedMime.includes(file.mimetype)) callback(null, true);
    else callback(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
});

export const uploadMany = upload.array('files', env.MAX_PROPOSALS);
