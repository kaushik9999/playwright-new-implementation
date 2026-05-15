# Playwright Framework

Production-grade end-to-end testing framework built on [Playwright](https://playwright.dev) + TypeScript, designed to scale to thousands of tests across UI, API and DB layers with sharded parallel execution on Docker and Jenkins.

---

## Highlights

- **Strict TypeScript** with path aliases (`@pages`, `@fixtures`, `@api`, …).
- **Composed fixtures** — lazy page objects, API client, DB client — replace the old "BaseTest" inheritance.
- **Auth state caching** via a `setup` project: log in once, reuse `storageState` across browser projects. Eliminates per-test UI login.
- **Schema-validated API tests** with [Zod](https://zod.dev) — no more `JSON.stringify(...).includes(key)` false positives.
- **Per-test DB client** with explicit lifecycle (no shared module-level connection).
- **dotenv** for local secrets; **Jenkins credentials** in CI.
- **Sharded parallel execution** via `docker compose`: N containers each run `--shard=i/N`.
- **Monocart reporter** as primary — test steps, sortable/filterable tables, pie/bar/line charts, trend across runs.
- **Playwright HTML + blob** for native merge-across-shards.
- **Winston with daily rotation** for structured logs (no unbounded log files).

---

## Repository layout

```
src/
  config/
    env.ts                 Strongly-typed env + dotenv loader
    environments/          qa.ts, dev.ts, staging.ts
    types.ts
  fixtures/                Organised per-module — `<module>/<layer>.fixture.ts`
    base.ts                Cross-cutting (apiClient + worker-scoped dbClient)
    auth/
      ui.fixture.ts        Exposes loginPage. Add `api.fixture.ts` here for
                           authed apiClient when the API layer arrives.
    catalog/
      ui.fixture.ts        Exposes inventoryPage
    cart/
      ui.fixture.ts        Exposes cartPage
    checkout/
      ui.fixture.ts        Exposes checkoutPage
    preconditions/         Cross-cutting precondition factories (compose via mergeTests)
      featureFlag.fixture.ts  withFeatureFlag(name, value)
      userTier.fixture.ts     withUserTier('free'|'pro'|'enterprise')
  pages/
    common/BasePage.ts     Shared base class
    auth/LoginPage.ts      Auth module
    catalog/InventoryPage.ts
    cart/CartPage.ts
    checkout/CheckoutPage.ts
  api/
    ApiClient.ts           Wraps APIRequestContext, schema-validates responses
    schemas/               Zod schemas per endpoint
  db/
    DbClient.ts            Per-instance pg client with explicit lifecycle
  data/                    Test data — organised by module (use @data/<module>/<file>)
    auth/
      users.ts             User constants + error-message strings
      scenarios.ts         CSV loader (Zod-validated) for login-users.csv
      login-users.csv      CSV-driven login parameterization
    catalog/
      products.ts          Product catalog constants
  utils/                   Cross-cutting helpers (kept flat — they belong to no module)
    crypto.ts              AES decrypt using CRYPTO_KEY (env)
    pdfReader.ts           PDF text extraction
    excelReader.ts         Excel cell reads
    fileSystem.ts          Async fs helpers
    logger.ts              Winston with daily rotation
  setup/
    auth.setup.ts          Login once, save storageState
    global.setup.ts        Logging only — artifact cleanup is a Make/script step

tests/                     Organised by test layer first, then module:
  ui/                      Browser-driven specs
    auth/                  login.spec.ts, login-csv.spec.ts
    catalog/               inventory.spec.ts
    cross-module/          cart, checkout, conditional-flow examples
  api/                     API contract specs (no browser context)
    users.spec.ts
  db/                      DB integration specs (placeholder — add a `db` project
                           in playwright.config.ts when the first spec lands)

docker/
  Dockerfile               Production image based on mcr.microsoft.com/playwright
  docker-compose.yml       Sharded parallel run + merge service

ci/
  Jenkinsfile              Pipeline definition

reports/                   gitignored runtime output
```

---

## Quick start

### Prerequisites

- Node.js ≥ 18
- Docker (only for sharded / CI runs)

### 1. Install dependencies

```bash
npm ci
npx playwright install --with-deps
```

### 2. Configure secrets

```bash
cp .env.example .env
# Edit .env: set APP_USERNAME, APP_PASSWORD, CRYPTO_KEY
```

### 3. Run tests

```bash
ENV=qa npm test                   # all projects
ENV=qa npm run test:ui            # chromium + firefox + webkit
ENV=qa npm run test:api           # API only
ENV=qa npm run test:smoke         # tests tagged @smoke
ENV=qa npm run test:headed        # see the browser locally
ENV=qa npm run test:debug         # interactive debugger
```

### 4. Open the report

```bash
npm run report:open               # monocart (charts, trend, filtering)
npm run report:html               # Playwright's native HTML
```

---

## Sharding & parallelism

A single test run uses up to half your CPU cores by default (`workers`). For high-volume suites, slice the run into N independent shards executed in parallel containers.

### Locally with docker-compose

```bash
# build the image once
npm run docker:build

# run all four shards + merge step
ENV=qa APP_USERNAME=... APP_PASSWORD=... CRYPTO_KEY=... \
  npm run docker:test

# tear down
npm run docker:down
```

Reports land in `reports/` on the host:
- `reports/monocart/shard-N/` — per-shard interactive reports
- `reports/monocart/` (after merge) — combined report with charts
- `reports/html/shard-N/` — per-shard Playwright HTML
- `reports/blob/` — raw blob bundles consumed by `merge-reports`

### Scale the shard count

Edit [docker/docker-compose.yml](docker/docker-compose.yml) — add or remove `shard-N` services and update `SHARD_TOTAL` consistently across them.

### On Jenkins

[ci/Jenkinsfile](ci/Jenkinsfile) wires the same flow:

1. Build the image once per run.
2. `docker compose up` runs all shard services in parallel.
3. The `merge` service waits for shards (via `depends_on … condition: service_completed_successfully`) and produces the merged report.
4. Reports are archived and published via the **Publish HTML** plugin.

**Required Jenkins credentials** (Manage Jenkins → Credentials):
- `playwright-app-username` (Secret text)
- `playwright-app-password` (Secret text)
- `playwright-crypto-key` (Secret text)

---

## Writing tests

Import `test` and `expect` from the **narrowest feature fixture** your test needs — never from `@playwright/test` directly. This keeps each worker's import graph proportional to the tests it actually runs, which is what makes the framework scale to thousands of page objects without inflating boot time.

```typescript
// A login-flow test — uses the auth feature fixture.
import { test, expect } from '@fixtures/auth/ui.fixture';

test('user can log in', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.login('user@example.com', 'pw');
  await loginPage.expectLoggedIn();
});
```

```typescript
// A catalog test — uses just the catalog fixture.
import { test, expect } from '@fixtures/catalog/ui.fixture';

test('renders all products', async ({ inventoryPage }) => { /* … */ });
```

```typescript
// An API test that doesn't touch the UI — uses the cross-cutting base fixture.
import { test, expect } from '@fixtures/base';

test('GET /users', async ({ apiClient }) => { /* … */ });
```

### Spanning multiple modules

For tests that touch more than one module (e.g. catalog → cart → checkout), compose with `mergeTests`. The cross-module folder is the home for these:

```typescript
// tests/cross-module/checkout.spec.ts
import { mergeTests, expect } from '@playwright/test';
import { test as catalogTest }  from '@fixtures/catalog/ui.fixture';
import { test as cartTest }     from '@fixtures/cart/ui.fixture';
import { test as checkoutTest } from '@fixtures/checkout/ui.fixture';

const test = mergeTests(catalogTest, cartTest, checkoutTest);

test('full purchase', async ({ inventoryPage, cartPage, checkoutPage }) => { /* … */ });
```

### Conditional UI flows (feature flags, user tiers, etc.)

When the same UI page behaves differently based on a precondition (a feature flag, a user role, A/B variant, geo, plan tier), write **one test per variant** and use a precondition fixture to set the state before navigation. The test body must not branch on configuration.

```typescript
// tests/cross-module/checkout-newflow.spec.ts
import { mergeTests, expect } from '@playwright/test';
import { test as checkoutTest } from '@fixtures/checkout/ui.fixture';
import { withFeatureFlag }      from '@fixtures/preconditions/featureFlag.fixture';

const test = mergeTests(checkoutTest, withFeatureFlag('new_checkout', true));

test('checkout shows new flow when flag is on', async ({ checkoutPage }) => {
  // Flag is set. Test body is straight-line — no `if/else`.
});
```

Precondition factories that ship with the framework:
- `withFeatureFlag(name, value)` — toggles a feature flag
- `withUserTier('free' | 'pro' | 'enterprise')` — sets the active tier

Both are currently **mock-wired** via `addInitScript` (localStorage write) — sufficient to demonstrate the composition pattern. Swap for DB writes (`dbClient.query`), API calls (`apiClient.post('/test/feature-flags', …)`), or cookies depending on how your real AUT reads the precondition. See the inline TODOs in [src/fixtures/featureFlag.fixture.ts](src/fixtures/featureFlag.fixture.ts) for the swap points.

### Adding a new feature fixture

When a new page object joins a feature that already has a fixture file, add it there. When a new feature area appears (e.g. an admin console), create a new `<feature>.fixture.ts` that `extends` `base.ts`:

```typescript
// src/fixtures/admin.fixture.ts
import { test as baseTest } from './base';
import { AdminUsersPage } from '@pages/admin/AdminUsersPage';

export const test = baseTest.extend<{ adminUsersPage: AdminUsersPage }>({
  adminUsersPage: async ({ page }, use) => { await use(new AdminUsersPage(page)); },
});
export { expect } from '@playwright/test';
```

### Conventions

- **One page object per page**, locators defined in the constructor, methods describe user intent (`login()`, not `clickLoginButton()`).
- **Locator priority**: `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText({ exact: true })` → CSS as a last resort.
- **Never `==`** — use Playwright's auto-retrying matchers (`expect(locator).toBeVisible()`, `expect(locator).toHaveText(...)`).
- **Tags** with `@smoke`, `@regression`, `@api`, `@critical` — use `--grep @smoke` to filter.
- **No `page.waitForTimeout`** — use locator auto-wait or `expect.poll`/`expect.toPass`.
- **DB tests** request the `dbClient` fixture; never instantiate `DbClient` directly in tests.

---

## Test data cleanup

Tests that create persistent records (DB rows, API resources, S3 objects) must register cleanup via the `cleanup` fixture so the next test starts from a clean slate. Callbacks run in LIFO order during teardown — even if the test fails.

```typescript
import { test, expect } from '@fixtures/cleanup';

test('checkout creates an order', async ({ cleanup, apiClient }) => {
  const order = await apiClient.post('/orders', { ... });
  cleanup.add('delete order', async () => apiClient.delete(`/orders/${order.id}`));
  // ... assertions on `order` ...
});
```

For DB-backed cleanup, request both `cleanup` and `dbClient` via `mergeTests`. The cleanup fixture stack runs after the test's own work, but before the worker-scoped `dbClient` closes its connection.

---

## Accessibility & visual regression

Two extra spec types live alongside functional tests:

- **`tests/ui/accessibility/*.a11y.spec.ts`** — axe-core scans via the `a11y.fixture` (WCAG 2.0/2.1 AA tags). Tagged `@a11y @smoke` so they run on every gating CI build.
- **`tests/ui/visual/*.visual.spec.ts`** — Playwright's native `toHaveScreenshot()`. First run generates a baseline next to the spec; subsequent runs diff against it. Update with `npx playwright test --update-snapshots`.

These complement the aria snapshots in [tests/ui/auth/login.spec.ts](tests/ui/auth/login.spec.ts) — aria snapshots verify *accessibility-tree structure*, axe verifies *accessibility rules*, visual snapshots verify *pixel rendering*. All three catch different bugs.

---

## Flake quarantine

A `@quarantine` tag excludes a test from the gating CI run while keeping it visible in triage runs.

```typescript
test('flaky on webkit @quarantine (owner: @kaushik 2026-05-15 #1234)', async () => { /* ... */ });
```

Commands:

| Command | Purpose |
|---|---|
| `npm run test:gating` | What CI runs — excludes `@quarantine`. |
| `npm run test:quarantine` | Runs only quarantined tests for triage. |
| `npm test` | Runs everything (quarantined included but unenforced). |

Maintain the active register in [QUARANTINE.md](QUARANTINE.md). Tests should not stay quarantined longer than 14 days — either fix or delete.

---

## Cross-run trend store

[CustomReporter](src/reporter/CustomReporter.ts) appends each run's summary (pass/fail/flaky/skip counts + duration) to `reports/clean/history.json`, capped at the last 30 entries. The same file persists across runs on the same machine (or across shards within a single Docker compose run).

For team-wide trend visibility, push `history.json` to a central store (S3, GitHub artifact, a Grafana JSON datasource) on every CI build. Allure TestOps / Report Portal are the off-the-shelf alternatives if you outgrow the JSON-file approach.

---

## Test ownership

[CODEOWNERS](CODEOWNERS) routes PR reviews automatically. Module folders map to module teams; cross-module flows route to QA leads. Tag tests with `@team-foo` if you want runtime filtering or per-team Slack notifications later.

---

## AI-assisted authoring

Playwright ships several AI affordances. None require new dependencies — just upgrade Playwright and the features appear:

- **Copy Prompt button** on failed-test cards in the Playwright HTML report (`reports/html/`). Click it, paste the prompt into Claude/ChatGPT/Cursor, get a fix suggestion. Free win — works out of the box.
- **Aria snapshots** — `toMatchAriaSnapshot()` writes a YAML accessibility-tree baseline that LLMs can read and reason about. Used in [tests/ui/auth/login.spec.ts](tests/ui/auth/login.spec.ts).
- **Playwright MCP server** (`@playwright/mcp`) — exposes a real browser to MCP clients (Claude, Cursor, VS Code). Useful for test authoring/debugging; **not** for CI. Install on individual dev machines; framework code stays untouched.
- **Playwright Agents** (planner/generator/healer) — experimental as of v1.56+. Scaffold via `npx playwright init-agents`. Treat the healer as an authoring aid, never as a CI auto-fixer.

---

## Secrets

| Where      | How                                                                 |
|------------|---------------------------------------------------------------------|
| Local dev  | `.env` (gitignored), loaded by [src/config/env.ts](src/config/env.ts) |
| Docker run | passed via `docker-compose` `environment:` from your shell or `--env-file` |
| Jenkins    | `credentials('...')` in [ci/Jenkinsfile](ci/Jenkinsfile)            |

The legacy framework hardcoded an AES key (`'SECRET'`) in source. That has been removed. If you want to keep storing the password encrypted, set `CRYPTO_KEY` and use `npm run crypto:encrypt -- 'mypassword'` to generate ciphertext.

---

## Development workflow

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint .
npm run format        # prettier
npm run clean         # wipe reports/ .auth/ test-results/
```

---

## License

MIT — see [LICENSE](LICENSE).
