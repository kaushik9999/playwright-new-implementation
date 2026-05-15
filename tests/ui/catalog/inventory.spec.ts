import { test, expect } from '@fixtures/catalog/ui.fixture';
import { ALL_PRODUCTS, Products } from '@data/catalog/products';

// Inventory suite. These tests rely on `auth.setup.ts` having saved a logged-in storage state — they go straight to `/inventory.html`.
test.describe('Inventory catalog @smoke', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('renders all six products', async ({ inventoryPage }) => {
    await test.step('catalog has the expected number of items', async () => {
      expect(await inventoryPage.itemCount()).toBe(ALL_PRODUCTS.length);
    });
  });

  test('cart badge starts hidden and tracks add/remove', async ({ inventoryPage }) => {
    await test.step('cart starts empty', async () => {
      await inventoryPage.expectCartCount(0);
    });
    await test.step('add backpack — badge shows 1', async () => {
      await inventoryPage.addToCart(Products.backpack);
      await inventoryPage.expectCartCount(1);
    });
    await test.step('add bike light — badge shows 2', async () => {
      await inventoryPage.addToCart(Products.bikeLight);
      await inventoryPage.expectCartCount(2);
    });
    await test.step('remove backpack — badge falls back to 1', async () => {
      await inventoryPage.removeFromCart(Products.backpack);
      await inventoryPage.expectCartCount(1);
    });
  });
});

test.describe('Inventory sorting @regression', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('price low-to-high orders items ascending', async ({ inventoryPage }) => {
    await test.step('select "price low to high"', async () => {
      await inventoryPage.sortBy('lohi');
    });
    await test.step('prices are sorted ascending', async () => {
      const prices = await inventoryPage.productPrices();
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });
  });

  test('price high-to-low orders items descending', async ({ inventoryPage }) => {
    await test.step('select "price high to low"', async () => {
      await inventoryPage.sortBy('hilo');
    });
    await test.step('prices are sorted descending', async () => {
      const prices = await inventoryPage.productPrices();
      expect(prices).toEqual([...prices].sort((a, b) => b - a));
    });
  });

  test('name A-Z orders items alphabetically', async ({ inventoryPage }) => {
    await test.step('select "name (A to Z)"', async () => {
      await inventoryPage.sortBy('az');
    });
    await test.step('names are alphabetically ordered', async () => {
      const names = await inventoryPage.productNames();
      expect(names).toEqual([...names].sort());
    });
  });
});
