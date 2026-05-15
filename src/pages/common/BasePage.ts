import type { Page } from '@playwright/test';

// Common surface for every page object. Subclasses receive a Page, define their locators in the constructor, and expose intention-revealing methods. Direct `page.locator(...)` access from tests is discouraged — keep selectors inside page objects so that a UI change touches exactly one file.
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  // Navigate to a path relative to the project's baseURL.
  async goto(pathSegment = '/'): Promise<void> {
    await this.page.goto(pathSegment);
  }

  // URL of the currently displayed page. Useful for cross-tab/window assertions in tests.
  url(): string {
    return this.page.url();
  }
}
