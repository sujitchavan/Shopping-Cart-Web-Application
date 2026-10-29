import { createSelector } from '@reduxjs/toolkit';
import type { CartLine, CartState } from './cartSchema';

/** The cart only needs to know its own slice, which keeps it independent of the root state type. */
export interface CartRootState {
  cart: CartState;
}

export const selectCart = (state: CartRootState): CartState => state.cart;

export const selectCartLines = createSelector([selectCart], (cart): CartLine[] =>
  Object.values(cart.lines).sort((a, b) => a.addedAt - b.addedAt || a.productId - b.productId),
);

/** Sum of quantities: the number shown in the header badge. */
export const selectCartItemCount = createSelector([selectCart], (cart) => {
  let count = 0;
  for (const line of Object.values(cart.lines)) count += line.quantity;
  return count;
});

/** Number of distinct products. */
export const selectCartLineCount = createSelector(
  [selectCart],
  (cart) => Object.keys(cart.lines).length,
);

export const selectCartLine = (state: CartRootState, productId: number): CartLine | undefined =>
  state.cart.lines[productId];
