import { act, screen, waitFor, within } from '@testing-library/react';
import { CART_STORAGE_KEY, serializeCart } from '@/features/cart';
import { makeCart, makeLine, makeSnapshot } from '@/test/fixtures/cart';
import { productsFailWith } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { renderApp } from '@/test/renderWithProviders';

function seedCart(...lines: ReturnType<typeof makeLine>[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(makeCart(...lines)));
}

const badge = () => screen.getByRole('link', { name: /^Cart, / });
const subtotal = () => screen.getByTestId('subtotal').textContent;

describe('Add to cart (catalogue → badge)', () => {
  it('adds a product, updates the badge, swaps in a stepper and announces it', async () => {
    const { user } = renderApp();
    await screen.findByRole('list', { name: 'Products' });
    expect(badge()).toHaveAccessibleName('Cart, 0 items');

    await user.click(screen.getByRole('button', { name: 'Add to cart: Mens Cotton Jacket' }));

    expect(badge()).toHaveAccessibleName('Cart, 1 item');
    const increase = screen.getByRole('button', {
      name: 'Increase quantity of Mens Cotton Jacket',
    });
    expect(increase).toHaveFocus();
    expect(screen.getByTestId('live-region-polite')).toHaveTextContent(
      'Added Mens Cotton Jacket. Cart has 1 item.',
    );
  });

  it('applies ten rapid clicks exactly, clamped at the max of 10', async () => {
    const { user } = renderApp();
    await screen.findByRole('list', { name: 'Products' });
    await user.click(screen.getByRole('button', { name: 'Add to cart: Mens Cotton Jacket' }));

    const increase = screen.getByRole('button', {
      name: 'Increase quantity of Mens Cotton Jacket',
    });
    for (let i = 0; i < 10; i += 1) await user.click(increase);

    expect(badge()).toHaveAccessibleName('Cart, 10 items');
    expect(increase).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Max 10 per order')).toBeInTheDocument();
    expect(increase).toHaveAccessibleDescription('Max 10 per order');
  });

  it('decrease is aria-disabled at 1 and never removes the line', async () => {
    const { user } = renderApp();
    await screen.findByRole('list', { name: 'Products' });
    await user.click(screen.getByRole('button', { name: 'Add to cart: Mens Cotton Jacket' }));
    const decrease = screen.getByRole('button', {
      name: 'Decrease quantity of Mens Cotton Jacket',
    });
    expect(decrease).toHaveAttribute('aria-disabled', 'true');
    await user.click(decrease);
    expect(badge()).toHaveAccessibleName('Cart, 1 item');
  });

  it('persists to storage and updates when another tab writes', async () => {
    const { user } = renderApp();
    await screen.findByRole('list', { name: 'Products' });
    await user.click(screen.getByRole('button', { name: 'Add to cart: Mens Cotton Jacket' }));
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toContain('"quantity":1');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: CART_STORAGE_KEY,
          newValue: serializeCart(
            makeCart(makeLine(3, { quantity: 5 }), makeLine(9, { quantity: 2 })),
          ),
        }),
      );
    });
    expect(badge()).toHaveAccessibleName('Cart, 7 items');
  });
});

describe('Cart page', () => {
  it('shows the empty state with a link back to the catalogue', async () => {
    renderApp({ route: '/cart' });
    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/');
  });

  it('updates line totals, subtotal and badge as quantities change', async () => {
    seedCart(
      makeLine(10, {
        quantity: 3,
        snapshot: makeSnapshot({ title: 'Silicon Power 256GB SSD', priceCents: 1999 }),
      }),
      makeLine(7, {
        quantity: 1,
        snapshot: makeSnapshot({ title: 'White Gold Plated Princess', priceCents: 999 }),
      }),
    );
    const { user } = renderApp({ route: '/cart' });

    await screen.findByRole('heading', { level: 1, name: 'Your cart' });
    expect(subtotal()).toBe('$69.96');
    expect(badge()).toHaveAccessibleName('Cart, 4 items');

    await user.click(
      screen.getByRole('button', { name: 'Increase quantity of White Gold Plated Princess' }),
    );
    expect(subtotal()).toBe('$79.95');

    await user.click(
      screen.getByRole('button', { name: 'Decrease quantity of Silicon Power 256GB SSD' }),
    );
    expect(subtotal()).toBe('$59.96');
    expect(badge()).toHaveAccessibleName('Cart, 4 items');
    expect(screen.getByTestId('summary-count')).toHaveTextContent('4 items');
  });

  it('moves focus to the next Remove button, then the previous, then the empty heading', async () => {
    seedCart(makeLine(1, { addedAt: 1 }), makeLine(2, { addedAt: 2 }), makeLine(3, { addedAt: 3 }));
    const { user } = renderApp({ route: '/cart' });
    await screen.findByRole('heading', { level: 1, name: 'Your cart' });

    const removeButtons = () => screen.getAllByRole('button', { name: /^Remove / });
    await user.click(removeButtons()[1]!);
    await waitFor(() => expect(removeButtons()).toHaveLength(2));
    expect(removeButtons()[1]).toHaveFocus();

    await user.click(removeButtons()[1]!);
    await waitFor(() => expect(removeButtons()[0]).toHaveFocus());

    await user.click(removeButtons()[0]!);
    const empty = await screen.findByRole('heading', { name: 'Your cart is empty' });
    await waitFor(() => expect(empty).toHaveFocus());
    expect(badge()).toHaveAccessibleName('Cart, 0 items');
  });

  it('flags price changes and unavailable products, excluding the latter from the total', async () => {
    seedCart(
      makeLine(10, {
        quantity: 1,
        snapshot: makeSnapshot({ title: 'Silicon Power 256GB SSD', priceCents: 1500 }),
      }),
      makeLine(999, {
        quantity: 2,
        snapshot: makeSnapshot({ title: 'Discontinued Widget', priceCents: 5000 }),
      }),
    );
    renderApp({ route: '/cart' });

    expect(await screen.findByText('(price updated from $15.00)')).toBeInTheDocument();
    expect(screen.getByText(/No longer available/)).toBeInTheDocument();
    await waitFor(() => expect(subtotal()).toBe('$19.99'));
    const discontinued = screen.getByRole('article', { name: 'Discontinued Widget' });
    expect(within(discontinued).queryByRole('group')).toBeNull();
    expect(
      within(discontinued).getByRole('button', { name: 'Remove Discontinued Widget from cart' }),
    ).toBeInTheDocument();
  });

  it('still renders from snapshots with a banner when prices cannot be refreshed', async () => {
    server.use(productsFailWith(500));
    seedCart(makeLine(3, { quantity: 2, snapshot: makeSnapshot({ priceCents: 5599 }) }));
    const { user } = renderApp({ route: '/cart' });

    expect(await screen.findByText(/couldn't refresh prices/)).toBeInTheDocument();
    expect(subtotal()).toBe('$111.98');

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByText(/couldn't refresh prices/)).toBeNull());
  });

  it('clears the cart only after confirmation', async () => {
    seedCart(makeLine(1), makeLine(2));
    const { user } = renderApp({ route: '/cart' });
    await screen.findByRole('heading', { level: 1, name: 'Your cart' });

    await user.click(screen.getByRole('button', { name: 'Clear cart' }));
    const dialog = screen.getByRole('dialog', { name: 'Clear your cart?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Clear cart' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Clear cart' }),
    );
    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument();
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toBe(
      '{"version":1,"state":{"lines":{}}}',
    );
  });
});
