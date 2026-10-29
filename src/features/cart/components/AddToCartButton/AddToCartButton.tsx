import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/shared/ui';
import { useAddToCart, useCartLine } from '../../hooks/useCart';
import type { ProductSnapshot } from '../../model/cartSchema';
import { decrement, increment } from '../../model/cartSlice';
import { maxQuantityFor } from '../../model/policies';
import { QuantityStepper } from '../QuantityStepper/QuantityStepper';

interface AddToCartButtonProps {
  productId: number;
  snapshot: ProductSnapshot;
}

/** "Add to cart" until the product is in the cart, then an inline quantity stepper. */
export function AddToCartButton({ productId, snapshot }: AddToCartButtonProps) {
  const line = useCartLine(productId);
  const dispatch = useAppDispatch();
  const addToCart = useAddToCart();
  const [justAdded, setJustAdded] = useState(false);
  const max = maxQuantityFor(snapshot);

  if (line) {
    return (
      <QuantityStepper
        title={snapshot.title}
        quantity={line.quantity}
        max={maxQuantityFor(line.snapshot)}
        autoFocusIncrement={justAdded}
        onIncrement={() => dispatch(increment(productId))}
        onDecrement={() => dispatch(decrement(productId))}
      />
    );
  }

  if (max < 1) {
    return (
      <Button variant="secondary" disabled>
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      // Starts with the visible label, then names the product: WCAG 2.5.3 "label in name", and
      // twenty "Add to cart" buttons stay distinguishable in a screen reader's button list.
      aria-label={`Add to cart: ${snapshot.title}`}
      onClick={() => {
        setJustAdded(true);
        addToCart(productId, snapshot);
      }}
    >
      Add to cart
    </Button>
  );
}
