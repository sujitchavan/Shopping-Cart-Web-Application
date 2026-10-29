import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import type { AppStore } from '@/store/store';
import { AppProviders } from './providers';
import { routes } from './router';

export function App({ store }: { store: AppStore }) {
  const [router] = useState(() => createBrowserRouter(routes));
  return (
    <AppProviders store={store}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
