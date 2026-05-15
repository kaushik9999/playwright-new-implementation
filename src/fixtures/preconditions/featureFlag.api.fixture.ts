import { test as baseTest } from '../base';

// API-wired feature-flag fixture. Use when the AUT exposes a test-only
// endpoint that toggles flags (e.g. /test/feature-flags gated by env).
// Replace the endpoint path and payload shape with your real contract.
export function withFeatureFlagApi(flag: string, value: boolean) {
  return baseTest.extend<{ _featureFlag: void }>({
    _featureFlag: [
      async ({ apiClient }, use) => {
        await apiClient.post('/test/feature-flags', { [flag]: value });
        try {
          await use();
        } finally {
          // Reset to null so the next test starts from the default state.
          await apiClient.post('/test/feature-flags', { [flag]: null });
        }
      },
      { auto: true },
    ],
  });
}
