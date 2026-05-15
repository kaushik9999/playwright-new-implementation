import { test as baseTest } from '../base';
import { ApiClient } from '@api/ApiClient';
import { DbClient } from '@db/DbClient';
import { getSecrets } from '@config/env';

// Three precondition variants for the same logical concern. Pick the one that
// matches how your real AUT reads the flag. Compose with mergeTests.

// MOCK (default): writes localStorage via addInitScript. Safe for any AUT.
// No effect unless the AUT actually reads `ff_<flag>` from localStorage.
export function withFeatureFlag(flag: string, value: boolean) {
  return baseTest.extend<{ _featureFlag: void }>({
    _featureFlag: [
      async ({ context }, use) => {
        await context.addInitScript(
          ({ k, v }) => {
            try { window.localStorage.setItem(`ff_${k}`, JSON.stringify(v)); }
            catch { /* localStorage unavailable */ }
          },
          { k: flag, v: value },
        );
        await use();
      },
      { auto: true },
    ],
  });
}

// API-driven: POSTs to a test-only endpoint that toggles the flag server-side.
// Restores the prior value on teardown so parallel tests can't see each
// other's mutations. Requires APP_FEATURE_FLAG_ENDPOINT env var.
export function withFeatureFlagApi(flag: string, value: boolean) {
  return baseTest.extend<{ _featureFlagApi: void }>({
    _featureFlagApi: [
      async ({ request }, use) => {
        const endpoint = process.env.APP_FEATURE_FLAG_ENDPOINT;
        if (!endpoint) throw new Error('APP_FEATURE_FLAG_ENDPOINT not set.');
        const client = new ApiClient(request);

        const prior = await client.get(`${endpoint}/${flag}`);
        const priorValue = prior.ok() ? (await prior.json()).enabled : null;

        await client.post(endpoint, { name: flag, enabled: value });
        try { await use(); }
        finally {
          await client.post(endpoint, { name: flag, enabled: priorValue });
        }
      },
      { auto: true },
    ],
  });
}

// DB-driven: UPDATEs the feature_flags table directly. Worker-scoped dbClient
// is used so connections are reused across tests in the same worker.
export function withFeatureFlagDb(flag: string, value: boolean) {
  return baseTest.extend<{ _featureFlagDb: void }>({
    _featureFlagDb: [
      async ({}, use) => {
        if (!getSecrets().db) throw new Error('DB_* env vars not set.');
        const client = new DbClient(getSecrets().db!);
        await client.connect();
        const prior = await client.query<{ enabled: boolean }>(
          'SELECT enabled FROM feature_flags WHERE name=$1',
          [flag],
        );
        const priorValue = prior.rows[0]?.enabled ?? null;

        await client.query(
          'UPDATE feature_flags SET enabled=$1 WHERE name=$2',
          [value, flag],
        );
        try { await use(); }
        finally {
          await client.query(
            'UPDATE feature_flags SET enabled=$1 WHERE name=$2',
            [priorValue, flag],
          );
          await client.close();
        }
      },
      { auto: true },
    ],
  });
}
