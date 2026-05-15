import { test as baseTest } from '../base';
import { ApiClient } from '@api/ApiClient';
import { DbClient } from '@db/DbClient';
import { getSecrets } from '@config/env';

export type UserTier = 'free' | 'pro' | 'enterprise';

// MOCK (default): sets a user_tier localStorage key via addInitScript.
export function withUserTier(tier: UserTier) {
  return baseTest.extend<{ _userTier: void }>({
    _userTier: [
      async ({ context }, use) => {
        await context.addInitScript((t) => {
          try { window.localStorage.setItem('user_tier', t); }
          catch { /* localStorage unavailable */ }
        }, tier);
        await use();
      },
      { auto: true },
    ],
  });
}

// API: PUTs to /test/users/me to update the active user's tier server-side.
// Requires APP_USER_TIER_ENDPOINT env var.
export function withUserTierApi(tier: UserTier) {
  return baseTest.extend<{ _userTierApi: void }>({
    _userTierApi: [
      async ({ request }, use) => {
        const endpoint = process.env.APP_USER_TIER_ENDPOINT;
        if (!endpoint) throw new Error('APP_USER_TIER_ENDPOINT not set.');
        const client = new ApiClient(request);

        const prior = await client.get(endpoint);
        const priorTier = prior.ok() ? (await prior.json()).tier : null;

        await client.put(endpoint, { tier });
        try { await use(); }
        finally { await client.put(endpoint, { tier: priorTier }); }
      },
      { auto: true },
    ],
  });
}

// DB: UPDATEs users.tier directly. Requires TEST_USER_ID env var.
export function withUserTierDb(tier: UserTier) {
  return baseTest.extend<{ _userTierDb: void }>({
    _userTierDb: [
      async ({}, use) => {
        if (!getSecrets().db) throw new Error('DB_* env vars not set.');
        const userId = process.env.TEST_USER_ID;
        if (!userId) throw new Error('TEST_USER_ID not set.');
        const client = new DbClient(getSecrets().db!);
        await client.connect();
        const prior = await client.query<{ tier: string }>(
          'SELECT tier FROM users WHERE id=$1',
          [userId],
        );
        const priorTier = prior.rows[0]?.tier ?? 'free';

        await client.query('UPDATE users SET tier=$1 WHERE id=$2', [tier, userId]);
        try { await use(); }
        finally {
          await client.query('UPDATE users SET tier=$1 WHERE id=$2', [priorTier, userId]);
          await client.close();
        }
      },
      { auto: true },
    ],
  });
}
