import { test as baseTest } from '../base';
import { CartPage } from '@pages/cart/CartPage';

// Cart feature fixture: viewing, removing items, starting checkout. Cart tests that need to ARRIVE at the cart through the catalog UI (because the AUT has no API to seed a cart) should compose this fixture with the catalog fixture via `mergeTests`: import { mergeTests } from '@playwright/test'; import { test as catalog } from '@fixtures/catalog.fixture'; import { test as cart } from '@fixtures/cart.fixture'; const test = mergeTests(catalog, cart);
export const test = baseTest.extend<{
  cartPage: CartPage;
}>({
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export { expect } from '@playwright/test';
