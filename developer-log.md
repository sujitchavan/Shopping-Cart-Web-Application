# Developer log

## AI Strategy

### Workflow: research → plan → review plan → implement → validate

I never asked the AI to write code straight from the requirements. Each change went through these
steps:

1. **Research.** I asked questions first, with no code changes. Example: "In this requirement, RTK
   vs TanStack, which is better? In future we can have multiple states like checkout, dashboard,
   etc."
2. **Plan.** I asked for a plan in plan mode. Example: "Act as react architect and create
   implementation plan for below requirement – Use React 19, TypeScript", followed by the exact,
   full requirements for the web application.
3. **Review plan.** I reviewed the plan and corrected it before any code was written. In the
   first planning session: "Use Redux Toolkit because in future we might need more slices…
   Tailwind… rename products to catalog."
4. **Implement.** Only against the approved plan: "Act as senior react developer and implement
   this… using approved implementation plan."
5. **Validate.** I checked the result myself instead of trusting the AI's summary: the deployed
   Vercel app, the DevTools Network panel, Lighthouse, and Vercel logs. I also checked the tests
   ("is end-to-end test also done with Playwright?"). When something didn't hold up, I went back to
   research. For example, JS and CSS were still re-downloaded on every refresh, which led to the
   caching fix below.

### How I gave context

- **Role and constraints up front:** a role ("react architect" for planning, "senior react
  developer" for implementation) plus fixed constraints: React 19, TypeScript, Redux Toolkit,
  Tailwind, Zod, and feature naming (`catalog`, not `products`).
- **Real evidence instead of descriptions:** Vercel build and runtime logs, the deployed URL, and
  what I saw in the DevTools Network panel.
- **IDE selection:** I selected the exact lines in question (for example `catalogApi.ts`) so
  answers stayed on that code.
- **Review gates:** "first list the files not needed, do not remove directly… after that I'll
  confirm," and "suggest changes first, do not update the file directly."

### How prompting differed by task

| Task           | How I prompted                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture   | Plan mode, questions rather than instructions, and comparing options against future scope ("100 API calls", "checkout, address, dashboard"). No code until the plan was approved. |
| Implementation | Pointed at the approved plan, with ordering constraints. Follow-ups asked for scope limits: "monitoring we need to add for API calls only, this seems really big change."         |
| Tests          | I chose the tools myself (Vitest + MSW instead of Jest, Playwright for E2E). I asked "is end-to-end test also done with Playwright?" to check coverage instead of assuming it.    |

### A prompt I had to iterate on: asset caching

1. **First prompt:** "images/js bundles/css should not be downloaded again on page refresh… only
   after files change."
2. **Result:** grounding the prompt in what DevTools showed on the real deployment led to the root
   cause and commit `b09c10f`. Lighthouse went from 81 to 100.

## Human Audit

### 1. Performance: assets re-downloaded on every reload

**What the AI produced:** static images were served from `public/` and referenced by fixed paths.
Those files had no content hash, so they could not be cached long-term. On the deployed site,
every reload downloaded the full app shell again (about 178 kB of JS and CSS, all `200`).

**Before:**

```ts
// src/shared/lib/safeUrl.ts
export const PLACEHOLDER_IMAGE = `${env.basePath}placeholder.svg`;
```

```tsx
// src/app/Layout.tsx
<img src="/favicon.svg" alt="" width={28} height={28} />
```

**After** (commit `b09c10f`): the images are imported so the build hashes them, and the cache
rules are split. Hashed `/assets/*` files are immutable, and the HTML shell is revalidated.

```ts
// src/shared/lib/safeUrl.ts
import placeholderUrl from '@/assets/placeholder.svg';
export const PLACEHOLDER_IMAGE = placeholderUrl;
```

```json
// vercel.json
{ "source": "/((?!assets/).*)", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
{ "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
```

**Result:** on reload, the document returns `304` (0.1 kB) and all JS and CSS come from disk cache.
Lighthouse Performance went from 81 to 100. Details are in
[docs/performance-notes.md](docs/performance-notes.md).

### 2. Architecture: API layer built only for the catalogue

**What the AI produced:** `createApi`, the base query, retry logic and timeout all lived inside
`features/catalog/api/catalogApi.ts`. The store imported `catalogApi` directly. That works for one
endpoint. But every new feature (orders, address, dashboard) would either copy the retry and
timeout setup into its own `createApi`, adding one more reducer and middleware to the store each
time, or import from the catalogue feature.

**Before:**

```ts
// src/features/catalog/api/catalogApi.ts
const baseQuery = retry(fetchBaseQuery({ baseUrl: env.apiBaseUrl, timeout: 15_000 }), { ... });

const productsApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery,
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({ getProducts: ... }),
});
```

```ts
// src/store/rootReducer.ts
export const rootReducer = combineSlices(cartSlice, catalogApi);
```

**After** (commit `d2de6e1`): one shared API in `shared/api`. Features only inject endpoints, so
adding 100 or more API calls never touches the store or repeats the network setup.

```ts
// src/shared/api/baseApi.ts
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery, // retry, timeout, headers defined once in baseQuery.ts
  keepUnusedDataFor: 300,
  tagTypes: ['Product'],
  endpoints: () => ({}),
});
```

```ts
// src/features/catalog/api/catalogApi.ts
const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({ getProducts: ... }),
});
```

```ts
// src/store/rootReducer.ts
export const rootReducer = combineSlices(cartSlice, baseApi);
```

### 3. Performance: every cart row re-rendered on one quantity change

**What the AI produced:** the cart page passed new inline callbacks to each row, and
`CartLineItem` wasn't memoized. Clicking "+" on one item re-rendered every row in the cart.

**Before:**

```tsx
// src/pages/CartPage/CartPage.tsx
<CartLineItem
  line={line}
  onIncrement={() => dispatch(increment(line.productId))} // new function every render
  onRemove={() => handleRemove(line.productId, line.title)}
/>
```

**After** ([PR #18](https://github.com/sujitchavan/Shopping-Cart-Web-Application/pull/18), commit
`1ede509`): callbacks take the product id and are created once, and the row is memoized by its
values.

```tsx
// src/pages/CartPage/CartPage.tsx
const handleIncrement = useCallback(
  (productId: number) => dispatch(increment(productId)),
  [dispatch],
);
<CartLineItem line={line} onIncrement={handleIncrement} onRemove={handleRemove} />;
```

```tsx
// src/features/cart/components/CartLineItem/CartLineItem.tsx
export const CartLineItem = memo(function CartLineItem(...) { ... }, propsEqual); // compares line values
```

**Result:** only the changed row re-renders. A new test (`CartPage.rerender.test.tsx`) failed on the

## Verification

**Example:** the cart re-render test from
[PR #18](https://github.com/sujitchavan/Shopping-Cart-Web-Application/pull/18),
`src/pages/CartPage/CartPage.rerender.test.tsx`.

1. **Spotted it in code review.** In `CartPage.tsx`, each `CartLineItem` received new inline
   functions (`onIncrement={() => dispatch(increment(line.productId))}`, etc.) on every render. I
   suspected this would re-render every cart row on any cart change.
2. **Confirmed it manually with the React Profiler.** I recorded one "+" click in a cart with many
   items. Every `CartLineItem` rendered, and the commit took **33 ms**.
3. **AI helped with the fix.** I gave it the exact expected behaviour: "3 items in the cart, click
   '+' on one, the other two rows must not re-render." It implemented stable callbacks that take
   `productId`, and `memo` on `CartLineItem`. It also wrote a test that counts renders per row.
4. **The test failed, and I fixed it.** The first version of the test never counted any renders: a
   top-level `vi.mock` was applied too late, because the test setup had already loaded the cart
   code. It was switched to `vi.resetModules()` + `vi.doMock()`. Once the counter recorded real
   renders, the test failed on the old code (`expected 1 to be +0`: an unchanged row re-rendered)
   and passed with the fix.
5. **Verified manually again with the Profiler.** The same click now takes **7.6 ms**, and the
   unchanged rows are greyed out (did not render). The screenshots are in
   [docs/performance-notes.md](docs/performance-notes.md#cart-page-re-renders-pr-18).

## A Disagreement: Zustand vs Redux Toolkit

**AI suggestion:** in planning mode, the AI chose Zustand for the cart. Based on the current scope
(one cart, one catalogue endpoint, two pages), it has the least boilerplate and the smallest bundle.

**What I did instead:** I asked for the plan to be updated to Redux Toolkit. The application is
meant to expand to checkout, address, dashboard and similar features, each with its own state, and
those features need to react to each other: placing an order clears the cart, and changing the
address changes the total. Redux Toolkit gives every feature the same pattern (slice or RTK Query
endpoints, listener middleware), and any feature can respond to another's actions without
importing it. With Zustand, each store would be separate and that wiring would be built by hand.
Full reasoning is in [docs/adr-001-state-management.md](docs/adr-001-state-management.md).
