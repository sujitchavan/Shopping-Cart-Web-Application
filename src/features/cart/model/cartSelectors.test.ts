import { makeCart, makeLine } from '@/test/fixtures/cart';
import {
  selectCartItemCount,
  selectCartLine,
  selectCartLineCount,
  selectCartLines,
} from './cartSelectors';

describe('cart selectors', () => {
  const state = {
    cart: makeCart(
      makeLine(2, { quantity: 3, addedAt: 200 }),
      makeLine(1, { quantity: 2, addedAt: 100 }),
      makeLine(3, { quantity: 1, addedAt: 100 }),
    ),
  };

  it('counts items (sum of quantities) and distinct lines', () => {
    expect(selectCartItemCount(state)).toBe(6);
    expect(selectCartLineCount(state)).toBe(3);
    expect(selectCartItemCount({ cart: { lines: {} } })).toBe(0);
  });

  it('orders lines by when they were added, ties on id', () => {
    expect(selectCartLines(state).map((line) => line.productId)).toEqual([1, 3, 2]);
  });

  it('memoises: the same input returns the same reference', () => {
    expect(selectCartLines(state)).toBe(selectCartLines(state));
    expect(selectCartLines({ cart: { ...state.cart } })).not.toBe(selectCartLines(state));
  });

  it('looks up a single line', () => {
    expect(selectCartLine(state, 2)?.quantity).toBe(3);
    expect(selectCartLine(state, 99)).toBeUndefined();
  });
});
