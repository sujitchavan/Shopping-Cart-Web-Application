/**
 * Cart business rules live here, not in components. These are UX guards only: real stock and
 * prices must be re-validated by the server at checkout.
 */
export const MAX_QTY_PER_LINE = 10;
export const MAX_CART_LINES = 100;
/** Persisted carts larger than this are rejected (DoS guard on tampered storage). */
export const MAX_PERSISTED_BYTES = 100_000;

export function maxQuantityFor(snapshot: { stock?: number | undefined }): number {
  const stock = snapshot.stock ?? Number.POSITIVE_INFINITY;
  return Math.max(0, Math.min(stock, MAX_QTY_PER_LINE));
}

/** Clamps an integer quantity into [1, max]. Non-integers are rejected with `null`. */
export function clampQuantity(quantity: number, max: number): number | null {
  if (!Number.isInteger(quantity) || max < 1) return null;
  return Math.min(Math.max(quantity, 1), max);
}
