import { makeLine, makeSnapshot } from '@/test/fixtures/cart';
import {
  cartSubtotalCents,
  payableItemCount,
  priceCartLines,
  type LiveProductPrice,
} from './cartPricing';
import { clampQuantity, maxQuantityFor, MAX_QTY_PER_LINE } from './policies';

const live = (id: number, priceCents: number, title = `Live ${id}`): LiveProductPrice => ({
  id,
  title,
  image: `https://fakestoreapi.com/img/${id}.jpg`,
  priceCents,
});

describe('priceCartLines', () => {
  it('uses snapshot prices while the catalogue is not loaded', () => {
    const [line] = priceCartLines(
      [makeLine(1, { quantity: 3, snapshot: makeSnapshot({ priceCents: 1999 }) })],
      undefined,
    );
    expect(line).toMatchObject({
      unitCents: 1999,
      lineTotalCents: 5997,
      priceChanged: false,
      unavailable: false,
      title: 'Mens Cotton Jacket',
      maxQuantity: MAX_QTY_PER_LINE,
    });
  });

  it('uses the live price and flags a change', () => {
    const [line] = priceCartLines(
      [makeLine(1, { quantity: 2, snapshot: makeSnapshot({ priceCents: 1000 }) })],
      [live(1, 1200, 'Renamed')],
    );
    expect(line).toMatchObject({
      unitCents: 1200,
      snapshotCents: 1000,
      lineTotalCents: 2400,
      priceChanged: true,
      title: 'Renamed',
    });
  });

  it('flags lines whose product left the catalogue', () => {
    const [line] = priceCartLines([makeLine(1)], [live(2, 100)]);
    expect(line?.unavailable).toBe(true);
    expect(line?.unitCents).toBe(5599);
  });
});

describe('totals', () => {
  const lines = priceCartLines(
    [
      makeLine(1, { quantity: 3, snapshot: makeSnapshot({ priceCents: 1999 }) }),
      makeLine(2, { quantity: 1, snapshot: makeSnapshot({ priceCents: 500 }) }),
      makeLine(3, { quantity: 4, snapshot: makeSnapshot({ priceCents: 999 }) }),
    ],
    [live(1, 1999), live(2, 500)],
  );

  it('excludes unavailable lines from the subtotal and the payable count', () => {
    expect(cartSubtotalCents(lines)).toBe(5997 + 500);
    expect(payableItemCount(lines)).toBe(4);
  });

  it('is zero for an empty cart', () => {
    expect(cartSubtotalCents([])).toBe(0);
    expect(payableItemCount([])).toBe(0);
  });
});

describe('policies', () => {
  it('limits by stock when known, otherwise by the per-line maximum', () => {
    expect(maxQuantityFor({})).toBe(MAX_QTY_PER_LINE);
    expect(maxQuantityFor({ stock: 3 })).toBe(3);
    expect(maxQuantityFor({ stock: 0 })).toBe(0);
  });

  it('clamps integers and rejects everything else', () => {
    expect(clampQuantity(5, 10)).toBe(5);
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(11, 10)).toBe(10);
    expect(clampQuantity(1.5, 10)).toBeNull();
    expect(clampQuantity(1, 0)).toBeNull();
  });
});
