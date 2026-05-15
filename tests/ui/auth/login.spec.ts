import { test, expect } from '@fixtures/auth/ui.fixture';
import {
  PASSWORD,
  Users,
  lockedOutErrorText,
  missingPasswordErrorText,
  missingUsernameErrorText,
} from '@data/auth/users';

// Login flow tests must start anonymous — bypass the shared storageState that the rest of the UI suite consumes.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login @smoke @critical', () => {
  test('standard_user can sign in', async ({ page, loginPage }) => {
    await test.step('open the login page', async () => {
      await loginPage.open();
      // Structural assertion — catches drift in form layout
      // (missing label, swapped roles, removed field, etc.) without
      // pinning down individual locator details. Complements the
      // behavioral checks below, not replaces them.
      await expect(page.locator('form')).toMatchAriaSnapshot();
    });
    await test.step('submit valid credentials', async () => {
      await loginPage.login(Users.standard, PASSWORD);
    });
    await test.step('lands on the inventory page', async () => {
      // Behavioral assertions — verify the action's outcome.
      await expect(page).toHaveURL(/inventory\.html$/);
      await loginPage.expectNoErrorMessage();
      // Structural assertion — verify the catalog rendered as expected.
      await expect(page.locator('.inventory_list')).toMatchAriaSnapshot();
    });
  });

  test('locked_out_user sees the lockout banner', async ({ loginPage }) => {
    await test.step('open the login page', async () => {
      await loginPage.open();
    });
    await test.step('submit credentials for the locked-out user', async () => {
      await loginPage.login(Users.lockedOut, PASSWORD);
    });
    await test.step('lockout banner is shown', async () => {
      await loginPage.expectErrorMessage(lockedOutErrorText);
    });
  });

  test('missing username surfaces a validation error', async ({ loginPage }) => {
    await test.step('open the login page', async () => {
      await loginPage.open();
    });
    await test.step('submit with username blank', async () => {
      await loginPage.login('', PASSWORD);
    });
    await test.step('validation error is shown', async () => {
      await loginPage.expectErrorMessage(missingUsernameErrorText);
    });
  });

  test('missing password surfaces a validation error', async ({ loginPage }) => {
    await test.step('open the login page', async () => {
      await loginPage.open();
    });
    await test.step('submit with password blank', async () => {
      await loginPage.login(Users.standard, '');
    });
    await test.step('validation error is shown', async () => {
      await loginPage.expectErrorMessage(missingPasswordErrorText);
    });
  });
});

// Parameterized example: same assertion shape, many inputs. Demonstrates the data-driven pattern tests should follow when exercising a single behavior against multiple users / inputs.
test.describe('Login — accepted users land on inventory @regression', () => {
  const acceptedUsers = [
    Users.standard,
    Users.problem,
    Users.performanceGlitch,
    Users.error,
    Users.visual,
  ];

  for (const username of acceptedUsers) {
    test(`${username} can sign in`, async ({ page, loginPage }) => {
      await test.step('open the login page', async () => {
        await loginPage.open();
      });
      await test.step(`sign in as ${username}`, async () => {
        await loginPage.login(username, PASSWORD);
      });
      await test.step('lands on the inventory page', async () => {
        await expect(page).toHaveURL(/inventory\.html$/);
      });
    });
  }
});
