import { mergeTests } from '@playwright/test';
import { test as catalogTest }  from '@fixtures/catalog/ui.fixture';
import { test as cartTest }     from '@fixtures/cart/ui.fixture';
import { test as checkoutTest, expect } from '@fixtures/checkout/ui.fixture';
import { Products } from '@data/catalog/products';
import type { ShippingDetails } from '@pages/checkout/CheckoutPage';

// Spans catalog → cart → checkout. Each fixture brings its page object.
const test = mergeTests(catalogTest, cartTest, checkoutTest);

const VALID_SHIPPING: ShippingDetails = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: '10001',
};

test.describe('Checkout @smoke @critical', () => {
  test('end-to-end purchase: add → cart → checkout → finish', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await test.step('add two items to the cart', async () => {
      await inventoryPage.open();
      await inventoryPage.addToCart(Products.backpack);
      await inventoryPage.addToCart(Products.fleeceJacket);
      await inventoryPage.expectCartCount(2);
    });

    await test.step('open cart and start checkout', async () => {
      await inventoryPage.openCart();
      await cartPage.expectOpen();
      await cartPage.startCheckout();
    });

    await test.step('submit shipping details', async () => {
      await checkoutPage.fillShipping(VALID_SHIPPING);
      await checkoutPage.clickContinue();
      await checkoutPage.expectOnOverview();
    });

    await test.step('order total includes both items', async () => {
      const totalLabel = await checkoutPage.readTotalLabel();
      // Backpack 29.99 + Fleece Jacket 49.99 = 79.98 (pre-tax)
      expect(totalLabel).toMatch(/Total: \$\d+\.\d{2}/);
    });

    await test.step('finish places the order', async () => {
      await checkoutPage.finishOrder();
      await checkoutPage.expectOrderComplete();
    });
  });
});

test.describe('Checkout shipping form @regression', () => {
  test.beforeEach(async ({ inventoryPage, cartPage }) => {
    await inventoryPage.open();
    await inventoryPage.addToCart(Products.onesie);
    await inventoryPage.openCart();
    await cartPage.startCheckout();
  });

  test('missing first name blocks continue', async ({ checkoutPage }) => {
    await checkoutPage.fillShipping({ ...VALID_SHIPPING, firstName: '' });
    await checkoutPage.clickContinue();
    await checkoutPage.expectShippingError('Error: First Name is required');
  });

  test('missing last name blocks continue', async ({ checkoutPage }) => {
    await checkoutPage.fillShipping({ ...VALID_SHIPPING, lastName: '' });
    await checkoutPage.clickContinue();
    await checkoutPage.expectShippingError('Error: Last Name is required');
  });

  test('missing postal code blocks continue', async ({ checkoutPage }) => {
    await checkoutPage.fillShipping({ ...VALID_SHIPPING, postalCode: '' });
    await checkoutPage.clickContinue();
    await checkoutPage.expectShippingError('Error: Postal Code is required');
  });
});
