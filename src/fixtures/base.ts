import { test as baseTest, expect } from '@playwright/test';
import { ApiClient } from '@api/ApiClient';
import { DbClient } from '@db/DbClient';
import { getSecrets } from '@config/env';

// Infrastructure-only fixtures: things that are not tied to any one feature area. Page objects do NOT belong here — they live in feature-area fixture files (e.g. `auth.fixture.ts`, `shopping.fixture.ts`) that extend this base. Why split? At thousands of page objects, importing them all here pulls every page module into every worker at boot. Feature-area fixtures keep the import graph proportional to what each test actually uses. For tests that span feature areas, use Playwright's `mergeTests`: import { mergeTests } from '@playwright/test'; import { test as authTest } from '@fixtures/auth.fixture'; import { test as shoppingTest } from '@fixtures/shopping.fixture'; export const test = mergeTests(authTest, shoppingTest);
export interface TestFixtures {
  apiClient: ApiClient;
}

export interface WorkerFixtures {
  // One DB connection per worker, reused by every test that worker runs. Per-test connections would exhaust Postgres's default `max_connections = 100` at ~100 parallel workers. If a test needs a transaction or isolated state, BEGIN/ROLLBACK inside the test — don't open a new client.
  dbClient: DbClient;
}

export const test = baseTest.extend<TestFixtures, WorkerFixtures>({
  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request));
  },

  dbClient: [
    async ({}, use) => {
      const dbConfig = getSecrets().db;
      if (!dbConfig) {
        throw new Error(
          `DB fixture requested but DB_* env vars are not set. See .env.example.`,
        );
      }
      const client = new DbClient(dbConfig);
      await client.connect();
      try {
        await use(client);
      } finally {
        await client.close();
      }
    },
    { scope: 'worker' },
  ],
});

export { expect };
