import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const candidatePaths = [
  path.join(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(currentDirectory, '../../../../.env')
];
for (const candidate of candidatePaths) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  TZ: z.string().default('America/Caracas'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_EXTRACTION_MODEL: z.string().default('gemini-2.5-flash-lite'),
  TAVILY_API_KEY: z.string().optional(),
  BCV_SOURCE_URL: z.string().default('https://www.bcv.org.ve/'),
  BCV_FALLBACK_RATE: z.coerce.number().default(130),
  AES_KEY: z.string().optional(),
  MAX_PROPOSALS: z.coerce.number().int().positive().default(20),
  ALLOWED_MIME: z.string().default('application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  DEMO_MODE: z.string().default('true'),
  DEMO_USER_ID: z.string().default('00000000-0000-4000-8000-000000000001')
});

export const env = envSchema.parse(process.env);

export const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || '';
