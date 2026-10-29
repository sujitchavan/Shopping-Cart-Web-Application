import type { SafeStorage } from '@/shared/lib/safeStorage';
import { parseCart, serializeCart, type CartState } from '../model/cartSchema';
import { MAX_PERSISTED_BYTES } from '../model/policies';

/** Stable across schema versions: the version lives inside the payload. */
export const CART_STORAGE_KEY = 'storefront.cart';

/** The seam for a future server cart (e.g. an RTK Query `cartApi`). */
export function loadCart(storage: SafeStorage): CartState {
  return parseCart(storage.get(CART_STORAGE_KEY));
}

export function saveCart(storage: SafeStorage, state: CartState): boolean {
  const serialized = serializeCart(state);
  if (serialized.length > MAX_PERSISTED_BYTES) return false;
  return storage.set(CART_STORAGE_KEY, serialized);
}
