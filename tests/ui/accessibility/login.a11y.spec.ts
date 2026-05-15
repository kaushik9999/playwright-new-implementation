import { test, expect } from '@fixtures/a11y.fixture';

// Login is the public-facing entry — a11y failures here block anyone
// using assistive tech from getting in. Run as part of @smoke gating.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Accessibility @a11y @smoke', () => {
  test('login page has no axe-detectable violations', async ({ page, makeAxe }) => {
    await page.goto('/');
    const results = await makeAxe().analyze();
    // toEqual([]) gives a readable diff of every violation in the failure.
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});
