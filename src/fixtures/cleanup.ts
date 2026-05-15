import { test as baseTest } from './base';

// Cleanup helper. Tests register teardown callbacks; the fixture runs them in
// LIFO order during teardown — even when the test fails. Use for: deleting
// rows created by the test, cancelling subscriptions, removing uploaded files.
export interface Cleanup {
  add(label: string, fn: () => Promise<void> | void): void;
}

export const test = baseTest.extend<{ cleanup: Cleanup }>({
  cleanup: async ({}, use) => {
    const stack: Array<{ label: string; fn: () => Promise<void> | void }> = [];
    const api: Cleanup = { add: (label, fn) => stack.push({ label, fn }) };

    await use(api);

    // LIFO: undo most recent action first.
    for (const { label, fn } of stack.reverse()) {
      try { await fn(); }
      catch (err) { console.error(`[cleanup] ${label} failed:`, err); }
    }
  },
});

export { expect } from '@playwright/test';
