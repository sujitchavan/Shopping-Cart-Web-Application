import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CartLineItem,
  CartSummary,
  clear,
  ClearCartDialog,
  decrement,
  EmptyCart,
  increment,
  removeItem,
} from '@/features/cart';
import { useGetProductsQuery } from '@/features/catalog';
import { announce } from '@/shared/lib/announce';
import { Banner, Button, PageHeading } from '@/shared/ui';
import {
  selectCartLinesWithPricing,
  selectCartSubtotalCents,
  selectPayableItemCount,
} from '@/store/cartPricingSelectors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { APP_NAME } from '../appName';

type FocusTarget = { kind: 'remove'; productId: number } | { kind: 'empty' };

export function CartPage() {
  const dispatch = useAppDispatch();
  // Subscribing keeps live prices fresh; the cart still renders from snapshots meanwhile.
  const {
    isError: catalogFailed,
    isFetching: catalogFetching,
    refetch,
  } = useGetProductsQuery(undefined);
  const lines = useAppSelector(selectCartLinesWithPricing);
  const subtotalCents = useAppSelector(selectCartSubtotalCents);
  const itemCount = useAppSelector(selectPayableItemCount);

  const removeButtons = useRef(new Map<number, HTMLButtonElement>());
  const emptyHeadingRef = useRef<HTMLHeadingElement>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);

  // After a removal, move focus to the next line's Remove button, else the previous one, else the
  // empty-cart heading. Otherwise focus would fall back to <body>.
  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget.kind === 'empty') emptyHeadingRef.current?.focus();
    else removeButtons.current.get(focusTarget.productId)?.focus();
    setFocusTarget(null);
  }, [focusTarget, lines]);

  const handleRemove = useCallback(
    (productId: number, title: string) => {
      const index = lines.findIndex((line) => line.productId === productId);
      const neighbour = lines[index + 1] ?? lines[index - 1];
      dispatch(removeItem(productId));
      announce(`Removed ${title} from your cart.`);
      setFocusTarget(
        neighbour ? { kind: 'remove', productId: neighbour.productId } : { kind: 'empty' },
      );
    },
    [dispatch, lines],
  );

  return (
    <div className="flex flex-col gap-6">
      <title>{`Your cart (${itemCount}) · ${APP_NAME}`}</title>
      <PageHeading>Your cart</PageHeading>

      {catalogFailed && lines.length > 0 && (
        <Banner
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refetch()}
              disabled={catalogFetching}
            >
              Retry
            </Button>
          }
        >
          We couldn&apos;t refresh prices, so they may be out of date.
        </Banner>
      )}

      {lines.length === 0 ? (
        <EmptyCart headingRef={emptyHeadingRef} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
          <section aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="sr-only">
              Items in your cart
            </h2>
            <ul className="rounded-(--radius-card) border border-line px-4">
              {lines.map((line) => (
                <li key={line.productId}>
                  <CartLineItem
                    line={line}
                    onIncrement={() => dispatch(increment(line.productId))}
                    onDecrement={() => dispatch(decrement(line.productId))}
                    onRemove={() => handleRemove(line.productId, line.title)}
                    removeButtonRef={(element) => {
                      if (element) removeButtons.current.set(line.productId, element);
                      else removeButtons.current.delete(line.productId);
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
          <CartSummary itemCount={itemCount} subtotalCents={subtotalCents}>
            <ClearCartDialog
              onConfirm={() => {
                dispatch(clear());
                announce('Your cart is now empty.');
                setFocusTarget({ kind: 'empty' });
              }}
            />
          </CartSummary>
        </div>
      )}
    </div>
  );
}
