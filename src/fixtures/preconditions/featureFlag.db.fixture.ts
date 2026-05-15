import { test as baseTest } from '../base';

// DB-wired feature-flag fixture. Use when the AUT reads flags from a DB
// table that the test environment is allowed to write to.
// Replace the SQL with your real schema (table + column names).
export function withFeatureFlagDb(flag: string, value: boolean) {
  return baseTest.extend<{ _featureFlag: void }>({
    _featureFlag: [
      async ({ dbClient }, use) => {
        const prior = await dbClient.query<{ enabled: boolean | null }>(
          'SELECT enabled FROM feature_flags WHERE name = $1',
          [flag],
        );
        await dbClient.query(
          'INSERT INTO feature_flags(name, enabled) VALUES($1, $2) ' +
            'ON CONFLICT (name) DO UPDATE SET enabled = $2',
          [flag, value],
        );
        try {
          await use();
        } finally {
          // Restore prior state so tests that follow aren't poisoned.
          const wasSet = prior.rows[0]?.enabled;
          if (wasSet === undefined || wasSet === null) {
            await dbClient.query('DELETE FROM feature_flags WHERE name = $1', [flag]);
          } else {
            await dbClient.query(
              'UPDATE feature_flags SET enabled = $1 WHERE name = $2',
              [wasSet, flag],
            );
          }
        }
      },
      { auto: true },
    ],
  });
}
