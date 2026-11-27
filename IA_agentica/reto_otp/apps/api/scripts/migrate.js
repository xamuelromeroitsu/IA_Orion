import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from '../src/infrastructure/config.js';

const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../supabase/migrations');

async function main() {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL es obligatoria para aplicar migraciones');
  const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(`
      create table if not exists schema_migrations (
        filename text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    const files = (await fs.readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort();
    for (const fileName of files) {
      const applied = await client.query('select 1 from schema_migrations where filename = $1', [fileName]);
      if (applied.rowCount > 0) {
        console.log(`Ya aplicada: ${fileName}`);
        continue;
      }
      const sql = await fs.readFile(path.join(migrationsDirectory, fileName), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (filename) values ($1)', [fileName]);
        await client.query('commit');
        console.log(`Aplicada: ${fileName}`);
      } catch (error) {
        await client.query('rollback');
        throw new Error(`Falló ${fileName}: ${error.message}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
