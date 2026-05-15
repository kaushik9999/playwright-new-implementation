import { test as baseTest } from './base';
import AxeBuilder from '@axe-core/playwright';

// Accessibility fixture. Builds an AxeBuilder pre-configured with the
// WCAG 2.x AA tag set so a11y specs don't repeat config per file.
export const test = baseTest.extend<{ makeAxe: () => AxeBuilder }>({
  makeAxe: async ({ page }, use) => {
    await use(() =>
      new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']),
    );
  },
});

export { expect } from '@playwright/test';
