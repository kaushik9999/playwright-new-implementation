import { defineConfig, devices } from '@playwright/test';
import * as path from 'node:path';
import { env } from '@config/env';
import { STORAGE_STATE_FILE } from '@setup/paths';

const isCI = !!process.env.CI;

// Shard-aware output directories so parallel containers don't overwrite
// each other's artifacts. `SHARD_INDEX` is set by docker-compose
// (services/jenkins). Unset locally → single-shard run.
const shardId = process.env.SHARD_INDEX ?? 'local';
const reportsDir = path.resolve(process.cwd(), 'reports');
// CustomReporter appends `shard-${SHARD_INDEX}` internally — give it
// the root only, otherwise the path doubles up.
const cleanRoot = path.join(reportsDir, 'clean');
const blobOut = path.join(reportsDir, 'blob');
const htmlOut = path.join(reportsDir, 'html', `shard-${shardId}`);
const artifactDir = path.join(reportsDir, 'artifacts', `shard-${shardId}`);

export default defineConfig({
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : undefined,
  // Short-circuit catastrophic failures (env down, mass-broken locator).
  // Locally the default is unlimited so devs can see every failure; in
  // CI bail at MAX_FAILURES (defaults to 25 — override per pipeline).
  maxFailures: isCI ? Number(process.env.MAX_FAILURES ?? 25) : 0,
  timeout: 45_000,
  expect: { timeout: env.expectTimeout },
  outputDir: artifactDir,

  globalSetup: require.resolve('./src/setup/global.setup.ts'),

  reporter: [
    ['list'],
    [
      require.resolve('./src/reporter/CustomReporter.ts'),
      {
        outputDir: cleanRoot,
        title: `Playwright Tests — ${env.name} (shard ${shardId})`,
      },
    ],
    [
      'monocart-reporter',
      {
        name: `Playwright Tests — ${env.name} (shard ${shardId})`,
        outputFile: path.join(reportsDir, 'monocart', `shard-${shardId}`, 'index.html'),
        trend: path.join(reportsDir, 'monocart', 'trend.json'),
        columns: [
          { id: 'duration', name: 'Duration', type: 'duration' },
          { id: 'retry', name: 'Retry', type: 'number' },
        ],
      },
    ],
    ['blob', { outputDir: blobOut, fileName: `report-${shardId}.zip` }],
    ['html', { outputFolder: htmlOut, open: 'never' }],
  ],

  use: {
    baseURL: env.baseURL,
    navigationTimeout: env.navigationTimeout,
    actionTimeout: env.defaultTimeout,
    // SauceDemo (and many real apps) use `data-test` rather than the
    // Playwright default `data-testid`. Point getByTestId at the right
    // attribute once, project-wide.
    testIdAttribute: 'data-test',
    headless: true,
    viewport: { width: 1500, height: 800 },
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    screenshot: 'only-on-failure',
    // Record video for every test so reports always have a replay.
    // Trade-off: ~1–3 MB per test on disk; for 10k tests that adds up.
    // Switch back to 'retain-on-failure' (saves only failed-test videos)
    // once you're past the demo phase.
    video: 'on',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testDir: './src/setup',
      testMatch: /auth\.setup\.ts$/,
    },

    // Browser projects scan ./tests/ui (auth, catalog, cross-module).
    {
      name: 'chromium',
      testDir: './tests/ui',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE_FILE },
      dependencies: ['setup'],
    },

    {
      // Real Google Chrome (vs. Chromium). Catches Chrome-specific
      // behavior — codec support, proprietary APIs, autofill — that
      // bundled Chromium can miss. Requires `npx playwright install chrome`.
      name: 'chrome',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: STORAGE_STATE_FILE,
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      testDir: './tests/ui',
      use: { ...devices['Desktop Firefox'], storageState: STORAGE_STATE_FILE },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      testDir: './tests/ui',
      use: { ...devices['Desktop Safari'], storageState: STORAGE_STATE_FILE },
      dependencies: ['setup'],
    },

    {
      name: 'mobile-chrome',
      testDir: './tests/ui',
      use: { ...devices['Pixel 7'], storageState: STORAGE_STATE_FILE },
      dependencies: ['setup'],
    },

    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiBaseURL },
    },
  ],
});
