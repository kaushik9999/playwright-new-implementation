import * as path from 'node:path';
import * as fs from 'node:fs';
import * as dotenv from 'dotenv';
import type { EnvConfig, EnvName, Secrets } from './types';
import { qa } from './environments/qa';
import { dev } from './environments/dev';
import { staging } from './environments/staging';

const ENVIRONMENTS: Record<EnvName, EnvConfig> = { qa, dev, staging };

function loadDotenv(): void {
  const envFile = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
}

function resolveEnvName(): EnvName {
  const raw = process.env.ENV?.trim();
  if (!raw) {
    throw new Error(`ENV is required. Set ENV=qa|dev|staging.`);
  }
  if (!(raw in ENVIRONMENTS)) {
    throw new Error(
      `Unknown ENV "${raw}". Expected one of: ${Object.keys(ENVIRONMENTS).join(', ')}.`,
    );
  }
  return raw as EnvName;
}

loadDotenv();

export const env: EnvConfig = ENVIRONMENTS[resolveEnvName()];

let cachedSecrets: Secrets | undefined;

export function getSecrets(): Secrets {
  if (cachedSecrets) return cachedSecrets;

  const username = process.env.APP_USERNAME;
  const password = process.env.APP_PASSWORD;
  if (!username || !password) {
    throw new Error(
      `APP_USERNAME and APP_PASSWORD are required for this test. See .env.example.`,
    );
  }

  const dbHost = process.env.DB_HOST;
  const db = dbHost
    ? {
        host: dbHost,
        port: Number(process.env.DB_PORT ?? '5432'),
        user: process.env.DB_USER ?? '',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_NAME ?? '',
      }
    : null;

  cachedSecrets = { username, password, db };
  return cachedSecrets;
}
