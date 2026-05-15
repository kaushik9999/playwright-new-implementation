import type { FullConfig } from '@playwright/test';
import * as path from 'node:path';
import { env } from '@config/env';
import { logger } from '@utils/logger';
import { ensureDir } from '@utils/fileSystem';

const HEALTHCHECK_TIMEOUT_MS = 10_000;

// Fail fast if the application under test is unreachable. A multi-shard CI run that discovers a dead environment 40 minutes in costs real money; a 1-second probe up-front saves it. Treats 2xx, 3xx, and 4xx as "server is up" (the AUT may legitimately return 401 / 404 at the base URL). Only 5xx or transport errors fail the check. Set SKIP_HEALTHCHECK=true to bypass — useful when running a project that doesn't actually need this URL (e.g. API-only).
async function probe(url: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTHCHECK_TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    if (res.status >= 500) {
      throw new Error(`${url} returned HTTP ${res.status}`);
    }
    logger.info(`Health check OK: ${url} (HTTP ${res.status})`);
  } finally {
    clearTimeout(timer);
  }
}

async function globalSetup(_config: FullConfig): Promise<void> {
  const shard = process.env.SHARD_INDEX ?? 'single';
  logger.info(`Starting test run against ${env.name} (${env.baseURL}); shard=${shard}`);

  await ensureDir(path.resolve(process.cwd(), 'reports', 'logs'));

  if (process.env.SKIP_HEALTHCHECK === 'true') {
    logger.warn(`AUT health check skipped via SKIP_HEALTHCHECK=true`);
    return;
  }

  try {
    await probe(env.baseURL);
  } catch (err) {
    throw new Error(
      `AUT health check failed for ${env.baseURL}: ${(err as Error).message}.\n` +
        `Set SKIP_HEALTHCHECK=true to bypass.`,
    );
  }
}

export default globalSetup;
