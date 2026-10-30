# Testing strategy

## Shape of the suite

| Layer       | Tool                                 | What it covers                                                                                                | Count                                |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Unit        | Vitest                               | Pure logic: cart reducers, selectors, pricing, schemas, filter/sort/paginate, money, `safeUrl`, `safeStorage` | Most of the 224                      |
| Integration | Vitest + React Testing Library + MSW | Pages and components rendered with a real Redux store, with the network mocked                                | Part of the 224                      |
| End-to-end  | Playwright + axe                     | Real user flows in real browsers against the production build, under the production CSP                       | 11 tests × 6 browser/device projects |

Most tests sit where the bugs that cost money live: totals, quantity limits, persistence and
parsing untrusted data. These are pure functions, so their tests are fast and exact. Fewer, wider
tests then check that the pieces connect.

## Why these tools

### Vitest

Vitest shares Vite's config, aliases and transforms, so tests compile the same way as the app and
there is no separate Babel/Jest setup to keep in sync. It is fast in watch mode, has a
Jest-compatible API, and has V8 coverage built in.

### React Testing Library

RTL queries the DOM the way a user or screen reader does (`getByRole`, `getByLabelText`), not by
component internals. That keeps tests about behaviour: a refactor that keeps the UI the same keeps
the tests green. It also checks accessibility as a side effect. If a button can't be found by its
accessible name, the test fails.

Components are rendered with a **real** store (`renderWithProviders`), not a mocked one. Mocking
Redux would test that we call our own code, not that the cart works.

### MSW (Mock Service Worker)

MSW intercepts at the network layer, so the real `fetch`, RTK Query, base query and Zod parsing all
run in tests. Per-test overrides (`productsFailWith(500)`, `productsNetworkError()`,
`productsReturn(badPayload)`) make error, empty and malformed-data states easy to test without
mocking modules. The same handlers could later back a Storybook or the dev server.

### Playwright

The brief asks for at least one test above the unit level. Playwright runs the **production
build** under the **production security headers** (`vite preview`), so it catches problems jsdom
can't:

- CSP violations (any console error fails the test)
- Real `localStorage`, real reloads, and real `storage` events between two pages, for cross-tab sync
- Native `<dialog>` and `<select>` behaviour
- Layout on Chromium, Firefox, WebKit, Pixel 7, iPhone 14 and iPad

Compared with Cypress: Playwright drives multiple pages and contexts in one test (needed for
cross-tab), runs WebKit, and runs projects in parallel without a paid tier.

`@axe-core/playwright` scans the catalogue, cart, empty cart and error states and fails on any
serious or critical violation.

### E2E specs

| Spec                    | Flow                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shopping-flow.spec.ts` | Browse → filter → search → sort → add to cart → increment/decrement → totals update → remove. Clear cart with confirmation. A `@live` smoke test against the real API (nightly in CI) |
| `persistence.spec.ts`   | Cart survives a reload. Corrupted storage loads an empty cart. Tampered quantities are clamped                                                                                        |
| `cross-tab.spec.ts`     | Adding in one tab updates the badge in another                                                                                                                                        |
| `a11y.spec.ts`          | axe scans. Keyboard-only flow: skip link → add to cart → reach the cart                                                                                                               |

Playwright stubs the API by default (`stubApi`), so the suite doesn't flake when FakeStore is slow
or down. The nightly `@live` run checks that the real API still matches our schema.

## Coverage

### Current numbers

From `npm run test:coverage` on 2026-10-30 (224 tests, 22 files):

| Metric     | Covered          |
| ---------- | ---------------- |
| Statements | 97.92% (615/628) |
| Branches   | 93.75% (360/384) |
| Functions  | 97.20% (209/215) |
| Lines      | 98.36% (543/552) |

By area (lines / branches):

| Area                          | Lines | Branches | Threshold (lines / branches) |
| ----------------------------- | ----- | -------- | ---------------------------- |
| `features/cart/model`         | 98.9% | 97.3%    | 95 / 90                      |
| `features/cart/persistence`   | 100%  | 100%     | 95 / 90                      |
| `features/catalog/model`      | 100%  | 94.4%    | 95 / 90                      |
| `features/catalog/api`        | 100%  | 93.8%    | 95 / 90 (`productSchema.ts`) |
| `shared/lib`                  | 100%  | 93.6%    | 95 / 90                      |
| `features/cart/components`    | 95.3% | 94.3%    | 80 / 75                      |
| `features/catalog/components` | 96.6% | 90.9%    | 80 / 75                      |
| `features/catalog/hooks`      | 100%  | 88.9%    | 80 / 75                      |
| `shared/ui`                   | 96.6% | 85.7%    | 80 / 75                      |
| `pages`                       | 97.1% | 96.9%    | 80 / 75                      |
| `store`                       | 100%  | 66.7%    | 80 / 75 (global)             |

The full HTML report is uploaded by CI as the `coverage` artifact on every run (Actions → run →
Artifacts, kept 14 days). To produce it locally, run `npm run test:coverage` and open
`coverage/index.html`.

### Why these thresholds

The thresholds are enforced in `vite.config.ts`, and CI fails below them.

- **Core logic: 95% lines / 90% branches.** Applies to cart model and persistence, catalogue
  model, the product schema, and `shared/lib`. This is where a missed branch means a wrong total,
  a lost cart or untrusted data getting through. The code is pure, so a near-complete test costs
  little.
- **Everything else: 80% lines and statements / 75% branches.** A floor that catches a new module
  shipped with no tests, without pushing people to write tests for JSX glue just to hit a number.
  Branches are lower because JSX conditionals and defensive fallbacks produce branches that are
  rarely worth a dedicated test.
- **Excluded:** `main.tsx` (bootstrapping), `index.ts` barrels, `types.ts`, and test helpers.
  They contain no logic.

The actual numbers are well above the thresholds. That is intentional: the thresholds are a floor
against regressions, not a target. Pushing to 100% would mostly add tests that check
implementation details. For example, `store/` branches are at 66.7% because the
`listenToWindow = true` default is only exercised by the real app and E2E, not by unit tests. A
unit test for that would only assert that RTK Query's `setupListeners` was called.

## Edge cases covered

Cart reducers and policies:

- Ten rapid increments apply once each and clamp at the maximum.
- Stock limits are respected when stock is known. Out-of-stock and non-integer quantities are
  rejected.
- Decrement never goes below 1. Removal is always explicit.

Persistence and storage:

- Corrupted JSON, unknown versions, an oversized payload, `__proto__` keys and invalid lines give
  an empty or partial cart instead of a crash.
- Tampered quantities are clamped.
- Blocked or full storage falls back to memory.

Pricing:

- Integer-cent maths (3 × $19.99 = $59.97).
- A changed live price is flagged.
- Products removed from the catalogue are excluded from the total.

API:

- Non-array payloads become an error state. Individual invalid products are dropped and the rest
  shown. Duplicate IDs keep the first occurrence.
- Unsafe image URLs fall back to the placeholder.
- Network errors and 5xx responses show the error state with Retry.

URL state:

- Junk `page`, `sort` and `category` params fall back to defaults.

## Edge case deliberately not handled

**Two tabs changing the cart at the same moment.**

Each tab saves its whole cart to `localStorage`, and other tabs replace their cart with it
(`crossTabSync.ts` → `cartHydrated`). If tab A and tab B both save before either receives the
other's `storage` event, the later save overwrites the earlier one, and that tab's change is lost.

Example: tab A adds a jacket and tab B increments a T-shirt within the same few milliseconds. The
final cart has only one of the two changes.

**What does work:** normal use across tabs. Each change reaches the other tabs straight away and
they update (`e2e/cross-tab.spec.ts`). Changes are lost only inside that millisecond window.

**Why I didn't handle it:**

- A proper fix means merging line by line, with a version or timestamp on each cart line, instead
  of replacing the whole cart. That adds complexity to every cart write and to the stored format,
  for a case one person rarely triggers.
- A real checkout would move the cart to the server (`loadCart` / `saveCart` are where that plugs
  in), and conflicts are better resolved there, once, with server-side versioning.

**Revisit if:** carts become shared across devices or users, or analytics show changes being lost.
