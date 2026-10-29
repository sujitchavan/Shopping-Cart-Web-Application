import { isAnyOf } from '@reduxjs/toolkit';
import type { SafeStorage } from '@/shared/lib/safeStorage';
import type { AppStartListening } from '@/store/listenerMiddleware';
import { addItem, clear, decrement, increment, removeItem, setQuantity } from '../model/cartSlice';
import { saveCart } from './cartStorage';

/**
 * Persists the cart after every user-initiated cart action. `cartHydrated` is deliberately NOT in
 * the matcher: it is how other tabs' writes arrive, and echoing them back would loop forever.
 */
export const persistedCartActions = isAnyOf(
  addItem,
  increment,
  decrement,
  setQuantity,
  removeItem,
  clear,
);

export function addCartPersistenceListener(
  startListening: AppStartListening,
  storage: SafeStorage,
): () => void {
  return startListening({
    matcher: persistedCartActions,
    effect: (_action, api) => {
      saveCart(storage, api.getState().cart);
    },
  });
}
