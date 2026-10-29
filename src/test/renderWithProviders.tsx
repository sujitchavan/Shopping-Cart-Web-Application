import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { createSafeStorage, type SafeStorage } from '@/shared/lib/safeStorage';
import { createAppStore, type AppStore } from '@/store/store';

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  storage?: SafeStorage;
  store?: AppStore;
}

export function createTestStore(
  storage: SafeStorage = createSafeStorage(() => window.localStorage),
) {
  return createAppStore({ storage, listenToWindow: false });
}

/** Renders a component with a real store (never a mocked one) and a MemoryRouter. */
export function renderWithProviders(ui: ReactElement, options: ProviderOptions = {}) {
  const { route = '/', storage, store = createTestStore(storage), ...renderOptions } = options;
  const user = userEvent.setup();
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
    renderOptions,
  );
  return { ...result, store, user };
}

/** Renders the whole app (layout, lazy routes, badge, live region) at `route`. */
export function renderApp(
  options: { route?: string; storage?: SafeStorage; store?: AppStore } = {},
) {
  const { route = '/', storage, store = createTestStore(storage) } = options;
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const user = userEvent.setup();
  const result = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );
  return { ...result, store, user, router };
}
