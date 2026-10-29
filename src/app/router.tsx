import type { RouteObject } from 'react-router';
import { RouteErrorPage } from '@/pages/RouteErrorPage/RouteErrorPage';
import { Layout } from './Layout';
import { PageFallback } from './PageFallback';

/** Pages are lazy so each route only downloads its own code. Room left for `/products/:id`. */
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: Layout,
    HydrateFallback: PageFallback,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('@/pages/CatalogPage/CatalogPage')).CatalogPage,
            }),
          },
          {
            path: 'cart',
            lazy: async () => ({
              Component: (await import('@/pages/CartPage/CartPage')).CartPage,
            }),
          },
          {
            path: '*',
            lazy: async () => ({
              Component: (await import('@/pages/NotFoundPage/NotFoundPage')).NotFoundPage,
            }),
          },
        ],
      },
    ],
  },
];
