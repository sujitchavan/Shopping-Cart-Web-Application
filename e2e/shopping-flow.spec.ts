import { expect, test } from '@playwright/test';
import {
  cartLine,
  expectBadge,
  openSortIfCollapsed,
  productCard,
  stubApi,
  trackConsoleErrors,
} from './support';

const SSD = 'Silicon Power 256GB SSD'; // $19.99
const SANDISK = 'SanDisk SSD PLUS 1TB'; // $109.00

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

test('browse, filter, add to cart, adjust quantities and remove', async ({ page }) => {
  const consoleErrors = trackConsoleErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'All products' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Products' }).getByRole('listitem')).toHaveCount(12);
  await expectBadge(page, 0);

  // Filter → search → sort, all reflected in the URL.
  // The checkbox is visually hidden; users click the chip (its label).
  await page.locator('label', { hasText: 'electronics' }).click();
  await expect(page.getByRole('checkbox', { name: 'electronics' })).toBeChecked();
  await expect(page).toHaveURL(/category=electronics/);
  await page.getByLabel('Search products').fill('ssd');
  await expect(page).toHaveURL(/q=ssd/);
  await openSortIfCollapsed(page);
  await page.getByLabel('Sort by').selectOption('price-asc');
  await expect(page).toHaveURL(/sort=price-asc/);

  const titles = page.getByRole('list', { name: 'Products' }).getByRole('heading', { level: 3 });
  await expect(titles).toHaveText([SSD, SANDISK]);

  // Add product A once and product B twice (via the stepper).
  await productCard(page, SSD)
    .getByRole('button', { name: `Add to cart: ${SSD}` })
    .click();
  await expectBadge(page, 1);

  await productCard(page, SANDISK)
    .getByRole('button', { name: `Add to cart: ${SANDISK}` })
    .click();
  await expectBadge(page, 2);
  await page.getByRole('button', { name: `Increase quantity of ${SANDISK}` }).click();
  await expectBadge(page, 3);

  // Cart page: line totals, subtotal and badge at every step.
  await page.getByRole('link', { name: /^Cart, / }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your cart' })).toBeFocused();
  const subtotal = page.getByTestId('subtotal');
  await expect(cartLine(page, SSD).getByTestId('line-total')).toHaveText('Line total: $19.99');
  await expect(cartLine(page, SANDISK).getByTestId('line-total')).toHaveText('Line total: $218.00');
  await expect(subtotal).toHaveText('$237.99');

  await page.getByRole('button', { name: `Increase quantity of ${SSD}` }).click();
  await expect(cartLine(page, SSD).getByTestId('line-total')).toHaveText('Line total: $39.98');
  await expect(subtotal).toHaveText('$257.98');
  await expectBadge(page, 4);

  await page.getByRole('button', { name: `Decrease quantity of ${SANDISK}` }).click();
  await expect(cartLine(page, SANDISK).getByTestId('line-total')).toHaveText('Line total: $109.00');
  await expect(subtotal).toHaveText('$148.98');
  await expectBadge(page, 3);

  await page.getByRole('button', { name: `Remove ${SANDISK} from cart` }).click();
  await expect(cartLine(page, SANDISK)).toHaveCount(0);
  await expect(subtotal).toHaveText('$39.98');
  await expectBadge(page, 2);
  // Focus moved to the remaining line's Remove button rather than being lost.
  await expect(page.getByRole('button', { name: `Remove ${SSD} from cart` })).toBeFocused();

  // The whole flow ran under the production CSP with no violations or runtime errors.
  expect(consoleErrors).toEqual([]);
});

test('clear cart asks for confirmation in a native dialog', async ({ page }) => {
  await page.goto('/');
  await productCard(page, SSD)
    .getByRole('button', { name: `Add to cart: ${SSD}` })
    .click();
  await page.goto('/cart');

  await page.getByRole('button', { name: 'Clear cart' }).click();
  const dialog = page.getByRole('dialog', { name: 'Clear your cart?' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expectBadge(page, 1);

  await page.getByRole('button', { name: 'Clear cart' }).click();
  await dialog.getByRole('button', { name: 'Clear cart' }).click();
  await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
  await expectBadge(page, 0);
});

test('@live smoke test against the real API', async ({ page }) => {
  await page.unrouteAll();
  await page.goto('/');
  await expect(
    page.getByRole('list', { name: 'Products' }).getByRole('listitem').first(),
  ).toBeVisible({
    timeout: 20_000,
  });
});
