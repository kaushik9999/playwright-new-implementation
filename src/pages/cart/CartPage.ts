import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../common/BasePage';
import type { Product } from '@data/catalog/products';

// Cart page at `/cart.html` — shows items added from inventory and starts the checkout flow.
export class CartPage extends BasePage {
  private readonly title: Locator;
  private readonly cartItems: Locator;
  private readonly checkoutButton: Locator;
  private readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    this.cartItems = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
    this.continueShoppingButton = page.getByTestId('continue-shopping');
  }

  async expectOpen(): Promise<void> {
    await expect(this.title).toHaveText('Your Cart');
  }

  itemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async expectContainsProduct(product: Product): Promise<void> {
    const row = this.cartItems.filter({ hasText: product.displayName });
    await expect(row).toHaveCount(1);
  }

  async removeProduct(product: Product): Promise<void> {
    await this.page.getByTestId(`remove-${product.id}`).click();
  }

  async startCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }
}
