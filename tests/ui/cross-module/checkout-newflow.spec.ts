import { mergeTests, expect } from '@playwright/test';
import { test as catalogTest }  from '@fixtures/catalog/ui.fixture';
import { test as cartTest }     from '@fixtures/cart/ui.fixture';
import { test as checkoutTest } from '@fixtures/checkout/ui.fixture';
import { withFeatureFlag }      from '@fixtures/preconditions/featureFlag.fixture';
import { Products } from '@data/catalog/products';
import type { ShippingDetails } from '@pages/checkout/CheckoutPage';

// Demonstrates the precondition-fixture pattern for a feature-flag-gated UI variant. Composes: - catalog + cart + checkout module fixtures (page objects) - withFeatureFlag('new_checkout', true) precondition fixture The flag is set BEFORE any navigation (via `addInitScript` in the mock wiring). In a real AUT this is where the new-checkout UI variant would render — replace the body assertions accordingly.
const test = mergeTests(
  catalogTest,
  cartTest,
  checkoutTest,
  withFeatureFlag('new_checkout', true),
);

const VALID_SHIPPING: ShippingDetails = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '10001',
};

test.describe('Checkout — new flow @feature-flag @regression', () => {
  test('completes purchase with new_checkout flag enabled', async ({
    page,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await test.step('precondition is in place', async () => {
      // Real-AUT version of this assertion would check for the new-flow
      // banner / different CTA / changed wizard steps. SauceDemo doesn't
      // read the flag so we verify the fixture wrote the key as evidence
      // the precondition machinery ran.
      await page.goto('/');
      const flag = await page.evaluate(() =>
        window.localStorage.getItem('ff_new_checkout'),
      );
      expect(flag).toBe('true');
    });

    await test.step('add an item and check out', async () => {
      await inventoryPage.open();
      await inventoryPage.addToCart(Products.backpack);
      await inventoryPage.openCart();
      await cartPage.expectOpen();
      await cartPage.startCheckout();
    });

    await test.step('fulfill the (mock) new-checkout shipping form', async () => {
      await checkoutPage.fillShipping(VALID_SHIPPING);
      await checkoutPage.clickContinue();
      await checkoutPage.expectOnOverview();
      await checkoutPage.finishOrder();
      await checkoutPage.expectOrderComplete();
    });
  });
});
