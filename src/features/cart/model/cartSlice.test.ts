import { makeCart, makeLine, makeSnapshot } from '@/test/fixtures/cart';
import type { CartState } from './cartSchema';
import {
  addItem,
  cartHydrated,
  cartSlice,
  clear,
  decrement,
  increment,
  removeItem,
  setQuantity,
} from './cartSlice';
import { MAX_CART_LINES, MAX_QTY_PER_LINE } from './policies';

const reduce = cartSlice.reducer;
const empty = (): CartState => ({ lines: {} });

describe('cartSlice', () => {
  describe('addItem', () => {
    it('adds a new product with quantity 1 and an addedAt timestamp', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1234);
      const state = reduce(empty(), addItem({ productId: 3, snapshot: makeSnapshot() }));
      expect(state.lines[3]).toEqual({
        productId: 3,
        quantity: 1,
        addedAt: 1234,
        snapshot: makeSnapshot(),
      });
    });

    it('increments an existing line instead of duplicating it, refreshing the snapshot', () => {
      const start = makeCart(makeLine(3, { quantity: 2 }));
      const state = reduce(
        start,
        addItem({ productId: 3, snapshot: makeSnapshot({ priceCents: 6000 }) }),
      );
      expect(Object.keys(state.lines)).toEqual(['3']);
      expect(state.lines[3]?.quantity).toBe(3);
      expect(state.lines[3]?.snapshot.priceCents).toBe(6000);
    });

    it('clamps to the per-line maximum', () => {
      const start = makeCart(makeLine(3, { quantity: MAX_QTY_PER_LINE }));
      expect(
        reduce(start, addItem({ productId: 3, snapshot: makeSnapshot() })).lines[3]?.quantity,
      ).toBe(MAX_QTY_PER_LINE);
      expect(
        reduce(empty(), addItem({ productId: 4, snapshot: makeSnapshot(), quantity: 50 })).lines[4]
          ?.quantity,
      ).toBe(MAX_QTY_PER_LINE);
    });

    it('respects stock when it is known', () => {
      const state = reduce(
        empty(),
        addItem({ productId: 1, snapshot: makeSnapshot({ stock: 2 }), quantity: 5 }),
      );
      expect(state.lines[1]?.quantity).toBe(2);
    });

    it('ignores out-of-stock products and invalid quantities', () => {
      expect(
        reduce(empty(), addItem({ productId: 1, snapshot: makeSnapshot({ stock: 0 }) })),
      ).toEqual(empty());
      expect(
        reduce(empty(), addItem({ productId: 1, snapshot: makeSnapshot(), quantity: 1.5 })),
      ).toEqual(empty());
    });

    it('keeps the existing quantity when an invalid quantity is added to a line', () => {
      const start = makeCart(makeLine(1, { quantity: 2 }));
      expect(
        reduce(start, addItem({ productId: 1, snapshot: makeSnapshot(), quantity: Number.NaN }))
          .lines[1]?.quantity,
      ).toBe(2);
    });

    it('refuses new lines once the cart holds the maximum number of lines', () => {
      const full = makeCart(...Array.from({ length: MAX_CART_LINES }, (_, i) => makeLine(i + 1)));
      const state = reduce(full, addItem({ productId: 9999, snapshot: makeSnapshot() }));
      expect(state.lines[9999]).toBeUndefined();
    });
  });

  describe('increment / decrement', () => {
    it('increments up to the maximum and no further', () => {
      let state = makeCart(makeLine(1, { quantity: MAX_QTY_PER_LINE - 1 }));
      state = reduce(state, increment(1));
      state = reduce(state, increment(1));
      expect(state.lines[1]?.quantity).toBe(MAX_QTY_PER_LINE);
    });

    it('applies ten rapid increments exactly once each (clamped at the max)', () => {
      let state = makeCart(makeLine(1, { quantity: 1 }));
      for (let i = 0; i < 10; i += 1) state = reduce(state, increment(1));
      expect(state.lines[1]?.quantity).toBe(MAX_QTY_PER_LINE);

      let partial = makeCart(makeLine(2, { quantity: 1 }));
      for (let i = 0; i < 5; i += 1) partial = reduce(partial, increment(2));
      expect(partial.lines[2]?.quantity).toBe(6);
    });

    it('decrement at quantity 1 is a no-op (removal is explicit)', () => {
      const state = reduce(makeCart(makeLine(1, { quantity: 1 })), decrement(1));
      expect(state.lines[1]?.quantity).toBe(1);
      expect(reduce(makeCart(makeLine(1, { quantity: 3 })), decrement(1)).lines[1]?.quantity).toBe(
        2,
      );
    });

    it('ignores unknown product ids', () => {
      const start = makeCart(makeLine(1));
      expect(reduce(start, increment(42))).toEqual(start);
      expect(reduce(start, decrement(42))).toEqual(start);
    });
  });

  describe('setQuantity', () => {
    it.each([
      [4, 4],
      [0, 1],
      [-1, 1],
      [1e9, MAX_QTY_PER_LINE],
      [Number.NaN, 2],
      [2.5, 2],
      [Number.POSITIVE_INFINITY, 2],
    ])('setQuantity(%d) → %d', (input, expected) => {
      const state = reduce(
        makeCart(makeLine(1, { quantity: 2 })),
        setQuantity({ productId: 1, quantity: input }),
      );
      expect(state.lines[1]?.quantity).toBe(expected);
    });

    it('ignores unknown product ids', () => {
      expect(reduce(empty(), setQuantity({ productId: 1, quantity: 3 }))).toEqual(empty());
    });
  });

  it('removeItem removes the line, and is a no-op for a missing id', () => {
    const start = makeCart(makeLine(1), makeLine(2));
    expect(Object.keys(reduce(start, removeItem(1)).lines)).toEqual(['2']);
    expect(reduce(start, removeItem(99))).toEqual(start);
  });

  it('clear empties the cart and is idempotent', () => {
    const cleared = reduce(makeCart(makeLine(1)), clear());
    expect(cleared).toEqual(empty());
    expect(reduce(cleared, clear())).toEqual(empty());
  });

  it('cartHydrated replaces the whole state', () => {
    const incoming = makeCart(makeLine(7, { quantity: 4 }));
    expect(reduce(makeCart(makeLine(1)), cartHydrated(incoming))).toEqual(incoming);
  });
});
