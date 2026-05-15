import { mergeTests, expect } from '@playwright/test';
import { test as catalogTest }  from '@fixtures/catalog/ui.fixture';
import { test as cartTest }     from '@fixtures/cart/ui.fixture';
import { test as checkoutTest } from '@fixtures/checkout/ui.fixture';
import { withUserTier }         from '@fixtures/preconditions/userTier.fixture';
import { Products } from '@data/catalog/products';
import type { ShippingDetails } from '@pages/checkout/CheckoutPage';

// Demonstrates the precondition-fixture pattern for a user-tier-based UI variant. Composes catalog + cart + checkout fixtures with a `withUserTier('pro')` precondition. In a real AUT, pro-tier users might skip the upsell modal, see a "loyalty points" line in the summary, or get free shipping. Swap the body assertions for those when wiring against a real app.
const test = mergeTests(
  catalogTest,
  cartTest,
  checkoutTest,
  withUserTier('pro'),
);

const VALID_SHIPPING: ShippingDetails = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '10001',
};

test.describe('Checkout — pro tier @user-tier @regression', () => {
  test('pro-tier user completes purchase', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await test.step('precondition is in place', async () => {
      await page.goto('/');
      const tier = await page.evaluate(() =>
        window.localStorage.getItem('user_tier'),
      );
      expect(tier).toBe('pro');
    });

    await test.step('purchase the bike light', async () => {
      await inventoryPage.open();
      await inventoryPage.addToCart(Products.bikeLight);
      await inventoryPage.openCart();
      await cartPage.startCheckout();
      await checkoutPage.fillShipping(VALID_SHIPPING);
      await checkoutPage.clickContinue();
      await checkoutPage.expectOnOverview();
      await checkoutPage.finishOrder();
      await checkoutPage.expectOrderComplete();
    });
  });
});
