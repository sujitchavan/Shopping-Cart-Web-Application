import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { catalogApi } from '@/features/catalog';
import { addCartPersistenceListener, loadCart } from '@/features/cart';
import { env } from '@/shared/config/env';
import type { SafeStorage } from '@/shared/lib/safeStorage';
import type { AppStartListening } from './listenerMiddleware';
import { rootReducer } from './rootReducer';

export interface CreateStoreOptions {
  storage: SafeStorage;
  /** Wire refetch-on-focus/reconnect to window events. Off in tests. */
  listenToWindow?: boolean;
}

/**
 * The cart is loaded synchronously into `preloadedState` before the first render, so the badge
 * never flickers from 0 to N.
 */
export function createAppStore({ storage, listenToWindow = true }: CreateStoreOptions) {
  const listenerMiddleware = createListenerMiddleware();

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: { cart: loadCart(storage) },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(catalogApi.middleware),
    devTools: env.isDev,
  });

  addCartPersistenceListener(listenerMiddleware.startListening as AppStartListening, storage);
  if (listenToWindow) setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
export type { RootState } from './rootReducer';
