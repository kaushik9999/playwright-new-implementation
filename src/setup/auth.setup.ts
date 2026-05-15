import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '@pages/auth/LoginPage';
import { env, getSecrets } from '@config/env';
import { logger } from '@utils/logger';
import { ensureDir } from '@utils/fileSystem';
import { AUTH_STATE_DIR, STORAGE_STATE_FILE } from './paths';

setup('authenticate as standard user', async ({ page }) => {
  await ensureDir(AUTH_STATE_DIR);

  const secrets = getSecrets();
  logger.info(`Authenticating against ${env.baseURL} as ${secrets.username}`);

  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(secrets.username, secrets.password);

  // Confirm we landed on the inventory page before persisting state.
  await expect(page).toHaveURL(/inventory\.html$/);

  await page.context().storageState({ path: STORAGE_STATE_FILE });
  logger.info(`Saved storage state to ${STORAGE_STATE_FILE}`);
});
