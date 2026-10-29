import type { ReactNode } from 'react';

/**
 * The page's single <h1>. `tabIndex={-1}` lets the app shell move focus here after a route change
 * (see useRouteFocus), without adding it to the tab order.
 */
export function PageHeading({ children }: { children: ReactNode }) {
  return (
    <h1 tabIndex={-1} className="text-2xl font-bold tracking-tight sm:text-3xl">
      {children}
    </h1>
  );
}
