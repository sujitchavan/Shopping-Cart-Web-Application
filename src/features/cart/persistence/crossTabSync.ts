import { emptyCart, parseCart, type CartState } from '../model/cartSchema';
import { CART_STORAGE_KEY } from './cartStorage';

/**
 * Other tabs' writes arrive as `storage` events (never in the tab that wrote). Each value is
 * re-validated, because another tab, an extension or the user may have written it.
 * `key === null` means storage was cleared entirely.
 */
export function subscribeToCrossTabCart(
  target: Pick<Window, 'addEventListener' | 'removeEventListener'>,
  onCart: (state: CartState) => void,
): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === null) onCart(emptyCart());
    else if (event.key === CART_STORAGE_KEY) onCart(parseCart(event.newValue));
  };
  target.addEventListener('storage', handleStorage);
  return () => {
    target.removeEventListener('storage', handleStorage);
  };
}
