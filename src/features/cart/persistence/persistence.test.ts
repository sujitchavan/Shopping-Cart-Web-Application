import { createSafeStorage } from '@/shared/lib/safeStorage';
import { makeCart, makeLine, makeSnapshot } from '@/test/fixtures/cart';
import { createTestStore } from '@/test/renderWithProviders';
import { serializeCart } from '../model/cartSchema';
import {
  addItem,
  cartHydrated,
  clear,
  decrement,
  increment,
  removeItem,
  setQuantity,
} from '../model/cartSlice';
import { CART_STORAGE_KEY, loadCart, saveCart } from './cartStorage';
import { subscribeToCrossTabCart } from './crossTabSync';

const storage = () => createSafeStorage(() => window.localStorage);
const stored = () => window.localStorage.getItem(CART_STORAGE_KEY);

describe('cart persistence (real store + listener middleware)', () => {
  it('restores a valid cart into preloaded state', () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      serializeCart(makeCart(makeLine(3, { quantity: 2 }))),
    );
    const store = createTestStore(storage());
    expect(store.getState().cart.lines[3]?.quantity).toBe(2);
  });

  it('starts empty when stored data is corrupted', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, '{not json');
    expect(createTestStore(storage()).getState().cart).toEqual({ lines: {} });
  });

  it.each([
    ['addItem', addItem({ productId: 1, snapshot: makeSnapshot() })],
    ['increment', increment(5)],
    ['decrement', decrement(5)],
    ['setQuantity', setQuantity({ productId: 5, quantity: 4 })],
    ['removeItem', removeItem(5)],
    ['clear', clear()],
  ])('writes to storage after %s', (_name, action) => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      serializeCart(makeCart(makeLine(5, { quantity: 2 }))),
    );
    const store = createTestStore(storage());
    window.localStorage.removeItem(CART_STORAGE_KEY);

    store.dispatch(action);

    expect(JSON.parse(stored() ?? 'null')).toEqual({ version: 1, state: store.getState().cart });
  });

  it('does NOT write after cartHydrated (no cross-tab echo loop)', () => {
    const store = createTestStore(storage());
    store.dispatch(cartHydrated(makeCart(makeLine(1))));
    expect(stored()).toBeNull();
  });

  it('keeps working in memory when storage is full', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fullStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: (key) => {
        window.localStorage.removeItem(key);
      },
    };
    const full = createSafeStorage(() => fullStorage as Storage);
    const store = createTestStore(full);
    store.dispatch(addItem({ productId: 1, snapshot: makeSnapshot() }));
    store.dispatch(increment(1));
    expect(store.getState().cart.lines[1]?.quantity).toBe(2);
    expect(full.isPersistent()).toBe(false);
    expect(loadCart(full).lines[1]?.quantity).toBe(2);
  });
});

describe('saveCart', () => {
  it('refuses to write a cart above the size cap', () => {
    const s = storage();
    const huge = makeCart(makeLine(1, { snapshot: makeSnapshot({ title: 'x'.repeat(200_000) }) }));
    expect(saveCart(s, huge)).toBe(false);
    expect(stored()).toBeNull();
  });
});

describe('subscribeToCrossTabCart', () => {
  function storageEvent(key: string | null, newValue: string | null) {
    return new StorageEvent('storage', { key, newValue });
  }

  it('delivers validated carts written by other tabs, ignoring other keys', () => {
    const onCart = vi.fn();
    const unsubscribe = subscribeToCrossTabCart(window, onCart);

    window.dispatchEvent(storageEvent('other-key', 'x'));
    expect(onCart).not.toHaveBeenCalled();

    window.dispatchEvent(
      storageEvent(CART_STORAGE_KEY, serializeCart(makeCart(makeLine(2, { quantity: 3 })))),
    );
    expect(onCart).toHaveBeenLastCalledWith(makeCart(makeLine(2, { quantity: 3 })));

    window.dispatchEvent(storageEvent(CART_STORAGE_KEY, 'tampered'));
    expect(onCart).toHaveBeenLastCalledWith({ lines: {} });

    window.dispatchEvent(storageEvent(null, null));
    expect(onCart).toHaveBeenLastCalledWith({ lines: {} });

    unsubscribe();
    window.dispatchEvent(storageEvent(CART_STORAGE_KEY, serializeCart(makeCart(makeLine(9)))));
    expect(onCart).toHaveBeenCalledTimes(3);
  });
});
