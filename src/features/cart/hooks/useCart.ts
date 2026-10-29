import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { announce } from '@/shared/lib/announce';
import { pluralize } from '@/shared/lib/pluralize';
import { safeLocalStorage, type SafeStorage } from '@/shared/lib/safeStorage';
import { useAppDispatch, useAppSelector, useAppStore } from '@/store/hooks';
import type { ProductSnapshot } from '../model/cartSchema';
import { selectCartItemCount, selectCartLine, selectCartLineCount } from '../model/cartSelectors';
import { addItem, cartHydrated } from '../model/cartSlice';
import { subscribeToCrossTabCart } from '../persistence/crossTabSync';

/*
 * Narrow hooks: each component subscribes to exactly what it renders, so adding one product only
 * re-renders the badge and that product's button, not the whole grid.
 */

export function useCartCount(): number {
  return useAppSelector(selectCartItemCount);
}

export function useCartLineCount(): number {
  return useAppSelector(selectCartLineCount);
}

export function useCartLine(productId: number) {
  return useAppSelector((state) => selectCartLine(state, productId));
}

/** Adds a product and announces the result politely (no focus steal, no auto-opening drawer). */
export function useAddToCart() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  return useCallback(
    (productId: number, snapshot: ProductSnapshot) => {
      dispatch(addItem({ productId, snapshot }));
      const count = selectCartItemCount(store.getState());
      announce(`Added ${snapshot.title}. Cart has ${pluralize(count, 'item')}.`);
    },
    [dispatch, store],
  );
}

/** Keeps this tab's cart in step with writes from other tabs (last write wins). */
export function useCrossTabCartSync(): void {
  const dispatch = useAppDispatch();
  useEffect(
    () => subscribeToCrossTabCart(window, (state) => dispatch(cartHydrated(state))),
    [dispatch],
  );
}

/** False once storage has failed (private mode, quota) and the cart only lives in memory. */
export function useCartIsPersistent(storage: SafeStorage = safeLocalStorage): boolean {
  return useSyncExternalStore(storage.subscribe, storage.isPersistent, storage.isPersistent);
}
