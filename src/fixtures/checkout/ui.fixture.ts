import { test as baseTest } from '../base';
import { CheckoutPage } from '@pages/checkout/CheckoutPage';

// Checkout feature fixture: shipping form, overview, finalize. Most checkout tests will span modules (cart → checkout) and should use `mergeTests(catalog, cart, checkout)`. See `tests/cross-module/`.
export const test = baseTest.extend<{
  checkoutPage: CheckoutPage;
}>({
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from '@playwright/test';
