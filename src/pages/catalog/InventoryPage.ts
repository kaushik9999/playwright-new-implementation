import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../common/BasePage';
import type { Product } from '@data/catalog/products';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

// Catalog page shown after login at `/inventory.html`.
export class InventoryPage extends BasePage {
  private readonly title: Locator;
  private readonly items: Locator;
  private readonly sortDropdown: Locator;
  private readonly cartBadge: Locator;
  private readonly cartLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
  }

  async open(): Promise<void> {
    await this.goto('/inventory.html');
    await expect(this.title).toHaveText('Products');
  }

  itemCount(): Promise<number> {
    return this.items.count();
  }

  private addButton(product: Product): Locator {
    return this.page.getByTestId(`add-to-cart-${product.id}`);
  }

  private removeButton(product: Product): Locator {
    return this.page.getByTestId(`remove-${product.id}`);
  }

  async addToCart(product: Product): Promise<void> {
    await this.addButton(product).click();
    await expect(this.removeButton(product)).toBeVisible();
  }

  async removeFromCart(product: Product): Promise<void> {
    await this.removeButton(product).click();
    await expect(this.addButton(product)).toBeVisible();
  }

  async expectCartCount(count: number): Promise<void> {
    if (count === 0) {
      await expect(this.cartBadge).toBeHidden();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async productPrices(): Promise<number[]> {
    const text = await this.page.getByTestId('inventory-item-price').allInnerTexts();
    return text.map((t) => Number(t.replace('$', '')));
  }

  async productNames(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allInnerTexts();
  }
}
