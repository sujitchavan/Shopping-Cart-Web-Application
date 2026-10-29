import { expect, test } from '@playwright/test';
import { CART_STORAGE_KEY, expectBadge, productCard, stubApi } from './support';

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test('the cart survives a reload', async ({ page }) => {
  await page.goto('/');
  await productCard(page, 'Mens Cotton Jacket')
    .getByRole('button', { name: /^Add to cart/ })
    .click();
  await page.getByRole('button', { name: 'Increase quantity of Mens Cotton Jacket' }).click();
  await expectBadge(page, 2);

  await page.reload();
  await expectBadge(page, 2);
  await page.goto('/cart');
  await expect(page.getByTestId('subtotal')).toHaveText('$111.98');
});

test('corrupted storage loads an empty cart without crashing', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(
    (key) => window.localStorage.setItem(key, '{"version":1,"state":{"lines":{"__proto__":'),
    CART_STORAGE_KEY,
  );
  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'All products' })).toBeVisible();
  await expectBadge(page, 0);
});

test('tampered quantities are clamped on load', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        state: {
          lines: {
            3: {
              productId: 3,
              quantity: 9999,
              addedAt: 1,
              snapshot: { title: 'Mens Cotton Jacket', image: '', priceCents: 1 },
            },
          },
        },
      }),
    );
  }, CART_STORAGE_KEY);
  await page.reload();
  await expectBadge(page, 10);

  // Totals use the live catalogue price, never the tampered stored price.
  await page.goto('/cart');
  await expect(page.getByTestId('subtotal')).toHaveText('$559.90');
});
