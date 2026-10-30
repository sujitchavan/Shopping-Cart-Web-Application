import { screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type * as StepperModuleNs from '@/features/cart/components/QuantityStepper/QuantityStepper';

type StepperModule = typeof StepperModuleNs;

const STEPPER = '@/features/cart/components/QuantityStepper/QuantityStepper';

/*
 * Counts renders per cart row. The stepper is rendered once per row, so its render count is the
 * row's render count; the real stepper still renders, so the page behaves normally.
 *
 * The setup file already imports the cart (via the MSW fixtures), so a hoisted `vi.mock` would be
 * too late. Instead the module registry is reset and the app is imported fresh after `doMock`.
 */
async function loadAppWithCountingStepper() {
  const renders = new Map<string, number>();
  vi.resetModules();
  vi.doMock(STEPPER, async (importOriginal) => {
    const actual = await importOriginal<StepperModule>();
    function CountingStepper(props: ComponentProps<typeof actual.QuantityStepper>) {
      renders.set(props.title, (renders.get(props.title) ?? 0) + 1);
      return <actual.QuantityStepper {...props} />;
    }
    return { ...actual, QuantityStepper: CountingStepper };
  });
  const [{ renderApp }, cart, fixtures] = await Promise.all([
    import('@/test/renderWithProviders'),
    import('@/features/cart'),
    import('@/test/fixtures/cart'),
  ]);
  return { renders, renderApp, ...cart, ...fixtures };
}

const BACKPACK = 'Fjallraven Foldsack Backpack';
const TSHIRT = 'Mens Casual Premium Slim Fit T-Shirts';
const JACKET = 'Mens Cotton Jacket';

afterEach(() => {
  vi.doUnmock(STEPPER);
});

describe('Cart page re-renders', () => {
  it('changing one quantity re-renders only that row', async () => {
    const { renders, renderApp, CART_STORAGE_KEY, serializeCart, makeCart, makeLine } =
      await loadAppWithCountingStepper();
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      serializeCart(makeCart(makeLine(1), makeLine(2), makeLine(3))),
    );
    const { user } = renderApp({ route: '/cart' });
    // Wait for live catalogue titles and prices, so the snapshot → live price join has settled.
    await screen.findByRole('button', { name: `Increase quantity of ${TSHIRT}` });
    await waitFor(() => expect(screen.getByTestId('subtotal')).toHaveTextContent('$188.24'));

    renders.clear();
    await user.click(screen.getByRole('button', { name: `Increase quantity of ${BACKPACK}` }));
    await waitFor(() => expect(screen.getByTestId('subtotal')).toHaveTextContent('$298.19'));

    expect(renders.get(BACKPACK)).toBeGreaterThan(0);
    expect(renders.get(TSHIRT) ?? 0).toBe(0);
    expect(renders.get(JACKET) ?? 0).toBe(0);
  });
});
