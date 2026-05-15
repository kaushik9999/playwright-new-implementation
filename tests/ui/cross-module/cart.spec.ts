import { mergeTests } from '@playwright/test';
import { test as catalogTest } from '@fixtures/catalog/ui.fixture';
import { test as cartTest, expect } from '@fixtures/cart/ui.fixture';
import { Products } from '@data/catalog/products';

// Composes catalog + cart — saucedemo's cart is populated through the
// inventory UI, so cart tests need both surfaces.
const test = mergeTests(catalogTest, cartTest);

test.describe('Cart @smoke', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('items added on inventory are present on cart page', async ({
    inventoryPage,
    cartPage,
  }) => {
    await test.step('add backpack and fleece jacket to the cart', async () => {
      await inventoryPage.addToCart(Products.backpack);
      await inventoryPage.addToCart(Products.fleeceJacket);
      await inventoryPage.expectCartCount(2);
    });
    await test.step('navigate to the cart page', async () => {
      await inventoryPage.openCart();
      await cartPage.expectOpen();
    });
    await test.step('cart lists both items', async () => {
      expect(await cartPage.itemCount()).toBe(2);
      await cartPage.expectContainsProduct(Products.backpack);
      await cartPage.expectContainsProduct(Products.fleeceJacket);
    });
  });

  test('removing an item from the cart updates the count', async ({
    inventoryPage,
    cartPage,
  }) => {
    await test.step('add bike light and bolt T-shirt', async () => {
      await inventoryPage.addToCart(Products.bikeLight);
      await inventoryPage.addToCart(Products.boltTshirt);
    });
    await test.step('open the cart', async () => {
      await inventoryPage.openCart();
    });
    await test.step('remove bike light from the cart', async () => {
      await cartPage.removeProduct(Products.bikeLight);
    });
    await test.step('only the bolt T-shirt remains', async () => {
      expect(await cartPage.itemCount()).toBe(1);
      await cartPage.expectContainsProduct(Products.boltTshirt);
    });
  });

  test('continue shopping returns to inventory @regression', async ({
    page,
    inventoryPage,
    cartPage,
  }) => {
    await test.step('add an onesie and open the cart', async () => {
      await inventoryPage.addToCart(Products.onesie);
      await inventoryPage.openCart();
      await cartPage.expectOpen();
    });
    await test.step('click "Continue Shopping"', async () => {
      await cartPage.continueShopping();
    });
    await test.step('user is back on the inventory page with 1 item still in cart', async () => {
      await expect(page).toHaveURL(/inventory\.html$/);
      await inventoryPage.expectCartCount(1);
    });
  });
});
