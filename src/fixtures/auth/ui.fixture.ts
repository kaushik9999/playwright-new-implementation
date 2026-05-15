import { test as baseTest } from '../base';
import { LoginPage } from '@pages/auth/LoginPage';

// Auth feature fixtures. Use this in tests that exercise the login flow itself. Tests that just need to be "already logged in" should import their feature's own fixture — the storage state captured by `auth.setup.ts` already gives them an authenticated context.
export const test = baseTest.extend<{
  loginPage: LoginPage;
}>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
