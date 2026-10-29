import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { emptyCart, type CartState, type ProductSnapshot } from './cartSchema';
import { clampQuantity, MAX_CART_LINES, maxQuantityFor } from './policies';

export interface AddItemPayload {
  productId: number;
  snapshot: ProductSnapshot;
  quantity: number;
  addedAt: number;
}

/**
 * Every reducer is pure and idempotent with respect to its limits: the UI disables controls at the
 * limits, and the reducers clamp anyway (defence in depth). Removal is only ever explicit.
 */
export const cartSlice = createSlice({
  name: 'cart',
  initialState: emptyCart,
  reducers: {
    addItem: {
      reducer(state, { payload }: PayloadAction<AddItemPayload>) {
        const max = maxQuantityFor(payload.snapshot);
        const existing = state.lines[payload.productId];
        if (existing) {
          existing.snapshot = payload.snapshot;
          existing.quantity =
            clampQuantity(existing.quantity + payload.quantity, max) ?? existing.quantity;
          return;
        }
        const quantity = clampQuantity(payload.quantity, max);
        if (quantity === null || Object.keys(state.lines).length >= MAX_CART_LINES) return;
        state.lines[payload.productId] = {
          productId: payload.productId,
          quantity,
          addedAt: payload.addedAt,
          snapshot: payload.snapshot,
        };
      },
      // Date.now() lives in prepare, keeping the reducer itself pure and replayable.
      prepare(input: { productId: number; snapshot: ProductSnapshot; quantity?: number }) {
        return { payload: { ...input, quantity: input.quantity ?? 1, addedAt: Date.now() } };
      },
    },
    increment(state, { payload: productId }: PayloadAction<number>) {
      const line = state.lines[productId];
      if (line && line.quantity < maxQuantityFor(line.snapshot)) line.quantity += 1;
    },
    decrement(state, { payload: productId }: PayloadAction<number>) {
      const line = state.lines[productId];
      if (line && line.quantity > 1) line.quantity -= 1;
    },
    setQuantity(state, { payload }: PayloadAction<{ productId: number; quantity: number }>) {
      const line = state.lines[payload.productId];
      if (!line) return;
      const quantity = clampQuantity(payload.quantity, maxQuantityFor(line.snapshot));
      if (quantity !== null) line.quantity = quantity;
    },
    removeItem(state, { payload: productId }: PayloadAction<number>) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed record by design
      delete state.lines[productId];
    },
    clear() {
      return emptyCart();
    },
    /** Replaces the cart with an already-validated state (cross-tab sync). Never persisted. */
    cartHydrated(_state, { payload }: PayloadAction<CartState>) {
      return payload;
    },
  },
});

export const { addItem, increment, decrement, setQuantity, removeItem, clear, cartHydrated } =
  cartSlice.actions;
