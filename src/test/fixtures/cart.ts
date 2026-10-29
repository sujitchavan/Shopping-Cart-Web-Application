import type { CartLine, CartState, ProductSnapshot } from '@/features/cart';

export function makeSnapshot(overrides: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return {
    title: 'Mens Cotton Jacket',
    image: 'https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg',
    priceCents: 5599,
    ...overrides,
  };
}

export function makeLine(productId: number, overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId,
    quantity: 1,
    addedAt: 1_700_000_000_000 + productId,
    snapshot: makeSnapshot(),
    ...overrides,
  };
}

export function makeCart(...lines: CartLine[]): CartState {
  return { lines: Object.fromEntries(lines.map((line) => [line.productId, line])) };
}
