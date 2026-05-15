import { test as baseTest } from '../base';
import { InventoryPage } from '@pages/catalog/InventoryPage';

// Catalog feature fixture: browsing, sorting, and add-to-cart actions initiated from the product listing.
export const test = baseTest.extend<{
  inventoryPage: InventoryPage;
}>({
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
});

export { expect } from '@playwright/test';
