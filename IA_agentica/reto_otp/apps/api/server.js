import { createApp } from './src/interfaces/http/app.js';
import { env, supabaseKey } from './src/infrastructure/config.js';
import { logger } from './src/infrastructure/container.js';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info(`ORION API escuchando en http://localhost:${env.PORT}`);
  logger.info(`Supabase ${env.SUPABASE_URL ? 'configurado' : 'en modo local'}`);
  logger.info(`Gemini ${env.GEMINI_API_KEY ? 'configurado' : 'en modo determinista'}`);
  if (!supabaseKey) logger.warn('Sin clave de Supabase: se usa almacenamiento local');
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
