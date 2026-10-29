import { test } from '@playwright/test';
import { expectBadge, productCard, stubApi } from './support';

test('adding an item in one tab updates the badge in another', async ({ context }) => {
  const tabA = await context.newPage();
  const tabB = await context.newPage();
  await stubApi(tabA);
  await stubApi(tabB);

  await tabA.goto('/');
  await tabB.goto('/cart');
  await expectBadge(tabB, 0);

  await productCard(tabA, 'Mens Cotton Jacket')
    .getByRole('button', { name: /^Add to cart/ })
    .click();
  await expectBadge(tabA, 1);
  await expectBadge(tabB, 1);

  await tabB.getByRole('button', { name: 'Increase quantity of Mens Cotton Jacket' }).click();
  await expectBadge(tabB, 2);
  await expectBadge(tabA, 2);
});
