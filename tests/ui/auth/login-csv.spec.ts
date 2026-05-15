import { test, expect } from '@fixtures/auth/ui.fixture';
import { PASSWORD, lockedOutErrorText } from '@data/auth/users';
import { loginScenarios } from '@data/auth/scenarios';

// Demonstrates CSV-driven parameterization. Each row in `src/data/auth/login-users.csv` becomes its own test — distinct retry budget, distinct video, distinct report row. Notice the loop sits at module top-level (collection time), not inside a single `test()`. That is non-negotiable for parameterized tests in Playwright.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login — CSV-driven @regression', () => {
  for (const scenario of loginScenarios) {
    test(`${scenario.username} → ${scenario.expectedOutcome}`, async ({
      page,
      loginPage,
    }) => {
      await test.step('open the login page', async () => {
        await loginPage.open();
      });

      await test.step(`sign in as ${scenario.username}`, async () => {
        await loginPage.login(scenario.username, PASSWORD);
      });

      if (scenario.expectedOutcome === 'login_success') {
        await test.step('lands on the inventory page', async () => {
          await expect(page).toHaveURL(/inventory\.html$/);
        });
      } else {
        await test.step('lockout banner is shown', async () => {
          await loginPage.expectErrorMessage(lockedOutErrorText);
        });
      }
    });
  }
});
