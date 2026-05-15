# Quarantined tests

Tests tagged `@quarantine` are excluded from the gating CI run (`npm run test:gating`) but still execute in `npm run test:quarantine`. Use this list as a triage register, not a graveyard.

## Convention

- Tag the test/describe with `@quarantine` AND link an issue/owner in the title.
- Quarantine entries MUST have an owner and a created-on date.
- Re-evaluate weekly. A test in quarantine for >14 days should be either fixed or deleted.

```typescript
test.describe('Cart @smoke', () => {
  test('flaky on webkit @quarantine (owner: @kaushik 2026-05-15 #1234)', async ({ ... }) => {
    // ...
  });
});
```

## Active quarantine register

| Test path | Owner | Quarantined on | Issue | Reason |
|---|---|---|---|---|
| _(none yet)_ | | | | |

## Commands

| Command | What it does |
|---|---|
| `npm run test:gating` | Runs the suite excluding `@quarantine`. This is what CI gates on. |
| `npm run test:quarantine` | Runs only quarantined tests. Use for triage. |
| `npm test` | Runs everything (quarantined included, just not enforced). |
