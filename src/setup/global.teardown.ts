import type { FullConfig, FullResult } from '@playwright/test/reporter';
import { logger } from '@utils/logger';

// Runs once after the entire test run completes (after every shard, every
// project, every test has finished). The framework has no teardown work
// today — reports are written by reporters, dbClient is worker-scoped, and
// storageState is intentionally preserved across runs.
//
// Swap points when you need them:
//   - Push merged run summary to Datadog / Grafana / Slack
//   - Drop sandbox DB schemas spun up in globalSetup
//   - Revoke tokens minted in globalSetup
//   - Tear down docker-compose services the suite started
//   - Cleanup test data created in a shared QA environment
export default async function globalTeardown(
  _config: FullConfig,
  result?: FullResult,
): Promise<void> {
  const status = result?.status ?? 'unknown';
  logger.info(`test run completed: status=${status}`);
}
