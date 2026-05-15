import { test as baseTest } from '../base';
import type { UserTier } from './userTier.fixture';

// DB-wired user-tier fixture. Updates the tier column on the test user
// row and restores it on teardown.
export function withUserTierDb(userId: string, tier: UserTier) {
  return baseTest.extend<{ _userTier: void }>({
    _userTier: [
      async ({ dbClient }, use) => {
        const prior = await dbClient.query<{ tier: string }>(
          'SELECT tier FROM users WHERE id = $1',
          [userId],
        );
        if (prior.rowCount === 0) {
          throw new Error(`withUserTierDb: user ${userId} not found.`);
        }
        const previousTier = prior.rows[0]!.tier;
        await dbClient.query('UPDATE users SET tier = $1 WHERE id = $2', [tier, userId]);
        try {
          await use();
        } finally {
          await dbClient.query('UPDATE users SET tier = $1 WHERE id = $2', [previousTier, userId]);
        }
      },
      { auto: true },
    ],
  });
}
