import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from '../common/BasePage';

export interface ShippingDetails {
  readonly firstName: string;
  readonly lastName: string;
  readonly postalCode: string;
}

// Two-step checkout flow. Step one — `/checkout-step-one.html`: shipping details form. Step two — `/checkout-step-two.html`: order overview + Finish. Complete — `/checkout-complete.html`: thank-you screen.
export class CheckoutPage extends BasePage {
  // Step one
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly postalCodeInput: Locator;
  private readonly continueButton: Locator;
  private readonly errorMessage: Locator;

  // Step two
  private readonly summaryTotal: Locator;
  private readonly finishButton: Locator;

  // Complete
  private readonly completeHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByTestId('firstName');
    this.lastNameInput = page.getByTestId('lastName');
    this.postalCodeInput = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.errorMessage = page.getByTestId('error');

    this.summaryTotal = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');

    this.completeHeader = page.getByTestId('complete-header');
  }

  async fillShipping(details: ShippingDetails): Promise<void> {
    await this.firstNameInput.fill(details.firstName);
    await this.lastNameInput.fill(details.lastName);
    await this.postalCodeInput.fill(details.postalCode);
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  async expectShippingError(text: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(text);
  }

  async expectOnOverview(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-step-two\.html$/);
    await expect(this.finishButton).toBeVisible();
  }

  async readTotalLabel(): Promise<string> {
    return (await this.summaryTotal.textContent()) ?? '';
  }

  async finishOrder(): Promise<void> {
    await this.finishButton.click();
  }

  async expectOrderComplete(): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-complete\.html$/);
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }
}
