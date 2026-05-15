import { test, expect } from '@fixtures/auth/ui.fixture';

// Visual regression baseline for the login page. Playwright's
// toHaveScreenshot() generates a baseline on first run and diffs the
// rendered pixels on every subsequent run. Run with
// `npx playwright test --update-snapshots` after intentional UI changes.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Visual @visual @regression', () => {
  test('login page matches the baseline', async ({ page, loginPage }) => {
    await loginPage.open();
    // maxDiffPixelRatio gives a small tolerance for anti-aliasing across
    // OS/CI machines. Tighten if your baselines are produced in CI.
    await expect(page).toHaveScreenshot('login.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
