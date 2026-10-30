import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page } from '@playwright/test';

// Same fixture as the Vitest suite, so unit and E2E tests agree on the catalogue.
const products: unknown = JSON.parse(
  readFileSync(new URL('../src/test/fixtures/products.json', import.meta.url), 'utf8'),
);
const placeholderSvg = readFileSync(new URL('../src/assets/placeholder.svg', import.meta.url));

/** Collects console errors (CSP violations, React errors, failed requests) for a final assertion. */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

export const CART_STORAGE_KEY = 'storefront.cart';

/** Stubs the product API (and its images) so every run sees the same catalogue. */
export async function stubApi(page: Page, options: { status?: number; body?: unknown } = {}) {
  await page.route('https://fakestoreapi.com/products', (route) =>
    options.status && options.status >= 400
      ? route.fulfill({ status: options.status, body: '' })
      : route.fulfill({ json: options.body ?? products }),
  );
  await page.route('https://fakestoreapi.com/img/**', (route) =>
    route.fulfill({ body: placeholderSvg, contentType: 'image/svg+xml' }),
  );
}

export function cartBadge(page: Page): Locator {
  return page.getByRole('link', { name: /^Cart, / });
}

export async function expectBadge(page: Page, count: number) {
  await expect(cartBadge(page)).toHaveAccessibleName(
    `Cart, ${count} ${count === 1 ? 'item' : 'items'}`,
  );
}

/** Below `md`, sort lives behind a "Sort" disclosure. */
export async function openSortIfCollapsed(page: Page) {
  const toggle = page.getByRole('button', { name: /^Sort/ });
  if (await toggle.isVisible()) {
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  }
}

export function productCard(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title });
}

export function cartLine(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title });
}
