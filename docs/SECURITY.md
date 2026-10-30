# Security

The app has no login, payments or secrets. The realistic risks are:

- XSS through data we render (API responses, `localStorage`, URL params)
- Prototype pollution or crashes from malformed input
- Supply-chain vulnerabilities in dependencies

The approach is to treat every boundary as untrusted, validate it with Zod, and back that up with
a strict Content-Security-Policy.

## Dependency audit

Run on 2026-10-30:

| Command                               | Result                |
| ------------------------------------- | --------------------- |
| `npm audit` (all dependencies)        | **0 vulnerabilities** |
| `npm audit --omit=dev` (shipped code) | **0 vulnerabilities** |

What we did:

- **Upgraded before shipping.** The original plan used Zod 3 and Vitest 3, which had published
  advisories at the time. We moved to Zod 4 and Vitest 4 instead of shipping with known issues.
- **CI gate.** The `audit` job runs `npm run audit:prod`
  (`npm audit --omit=dev --audit-level=high`) on every push and PR, and it fails on high or
  critical advisories in shipped dependencies. A full `npm audit` also runs, for information only:
  dev-only findings don't reach users and are triaged by hand.
- **Nightly re-audit.** The scheduled CI run re-audits each night, so a new advisory against an
  unchanged lockfile is caught without waiting for a commit.
- **Dependabot.** Weekly npm updates (dev minor/patch grouped, runtime patches grouped) and monthly
  GitHub Actions updates. The open major-version PRs (ESLint 10, TypeScript 7, Vitest 5,
  jsdom 30, and others) are not security fixes, because the audit is clean on current versions.
  They need migration work and are reviewed one at a time instead of auto-merged.
- **Reproducible installs.** CI uses `npm ci` against the committed lockfile.
- **Small dependency surface.** 7 runtime dependencies: React, React DOM, React Router, Redux
  Toolkit, React Redux, Zod, clsx.

## Data from the API

FakeStore is a third-party API we don't control, so its responses are treated as untrusted input.
The boundary is `features/catalog/api/productSchema.ts`:

- **Schema validation with Zod.** Unknown keys are stripped, so `__proto__`, `constructor` and
  similar keys never reach app objects. IDs must be positive integers. Strings are trimmed and
  length-capped (title 300, description 5000, category 100). Price is capped at 1,000,000 and
  converted to integer cents. Rating must be 0–5 or it becomes `null`.
- **Partial failure.** A non-array payload is an error state. Individual bad products are dropped
  and logged, so one malformed record can't take down the whole catalogue. Duplicate IDs keep the
  first occurrence.
- **Image URLs are allow-listed** (`shared/lib/safeUrl.ts`). Only `https:` URLs on
  `fakestoreapi.com`, with no embedded credentials and at most 2048 characters, are rendered.
  `javascript:`, `data:`, `http:`, unknown hosts and junk all become the local placeholder.
- **No raw HTML.** All text is rendered through React, which escapes it. `react/no-danger` is an
  ESLint error, so `dangerouslySetInnerHTML` can't be added without a reviewed rule change.
- **Errors stay generic.** Users see "Something went wrong" with Retry. Details go to
  `shared/lib/logger.ts`, the one place diagnostics leave the app. Raw API errors are never shown
  on screen.

## Data saved in the browser

The cart lives in `localStorage` under `storefront.cart`. Any script on the origin, a browser
extension or the user can edit it, and other tabs write to it. Every read therefore goes through
the same validation as API data (`features/cart/model/cartSchema.ts`):

- **Size cap first.** Payloads over 100 kB are rejected before `JSON.parse`.
- **Never throws.** Malformed JSON, an unknown version or the wrong shape gives an empty cart
  instead of a crash.
- **Versioned envelope** (`{ version: 1, state }`) with a migration chain. Unknown future versions
  reset the cart instead of being guessed at.
- **Per-line validation.** Invalid lines are dropped and the rest kept. Quantities are clamped to
  the per-line limit. At most 100 lines are kept.
- **Keys are re-derived** from the validated `productId`. Raw object keys such as `__proto__` are
  never copied.
- **Stored prices are not trusted for totals.** When the live catalogue is available, totals use
  live prices. The stored snapshot is only used to render before the catalogue loads, and the UI
  flags price changes.
- **Image URLs in snapshots** go through the same `safeImageUrl` allow-list.
- **Cross-tab `storage` events** are re-validated with the same parser before they reach the store.
- **Blocked or full storage** (private mode, quota) falls back to memory with a one-time notice.

The URL is also input. Category, search, sort and page params are parsed with Zod and fall back to
defaults (`useCatalogParams.ts`). Page is capped, the search string is length-limited, and at most
20 `category` values of up to 100 characters are kept.

Configuration is validated too. `shared/config/env.ts` is the only module allowed to read
`import.meta.env` (enforced by ESLint), and `VITE_API_BASE_URL` must be `https://`. Everything
prefixed `VITE_` ends up in the bundle, so the schema documents that it must never hold secrets.

## HTTP security headers

Set in `vercel.json` and `public/_headers`, and sent by `vite preview` so E2E runs under the same
policy:

- `Content-Security-Policy`:
  `default-src 'self'; img-src 'self' https://fakestoreapi.com; connect-src 'self' https://fakestoreapi.com; script-src 'self'; style-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`.
  There is no `unsafe-inline` and no `unsafe-eval`, so even if markup were injected, inline scripts
  wouldn't run. The E2E helper fails a test on any console error, which includes CSP violations.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Frame-Options: DENY` and `frame-ancestors 'none'` (clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`

## Decided not to act on

| Item                                  | Reasoning                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Encrypting the cart in `localStorage` | It holds product IDs, quantities and public prices, nothing sensitive. Any key would have to ship in the bundle, so encryption would add no real protection. |
