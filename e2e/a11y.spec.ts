import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectBadge, productCard, stubApi } from './support';

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
}

test.describe('axe scans', () => {
  test('catalogue', async ({ page }) => {
    await stubApi(page);
    await page.goto('/');
    await expect(page.getByRole('list', { name: 'Products' })).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('cart with items', async ({ page }) => {
    await stubApi(page);
    await page.goto('/');
    await productCard(page, 'Mens Cotton Jacket')
      .getByRole('button', { name: /^Add to cart/ })
      .click();
    await page.goto('/cart');
    await expect(page.getByTestId('subtotal')).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('empty cart', async ({ page }) => {
    await stubApi(page);
    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    await expectNoSeriousViolations(page);
  });

  test('error state', async ({ page }) => {
    await stubApi(page, { status: 500 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: "We couldn't load products" })).toBeVisible({
      timeout: 15_000,
    });
    await expectNoSeriousViolations(page);
  });
});

test('keyboard only: skip link, add to cart, reach the cart', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Keyboard flow is a desktop concern');
  await stubApi(page);
  await page.goto('/');
  await expect(page.getByRole('list', { name: 'Products' })).toBeVisible();

  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  const add = productCard(page, 'Mens Cotton Jacket').getByRole('button', { name: /^Add to cart/ });
  await add.focus();
  await page.keyboard.press('Enter');
  // Focus is not lost when the button turns into a stepper.
  const increase = page.getByRole('button', { name: 'Increase quantity of Mens Cotton Jacket' });
  await expect(increase).toBeFocused();
  await page.keyboard.press('Enter');
  await expectBadge(page, 2);

  await page.getByRole('link', { name: /^Cart, / }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Your cart' })).toBeFocused();
});
