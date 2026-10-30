import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigation } from 'react-router';
import { clsx } from 'clsx';
import { CartBadge, StorageNotice, useCrossTabCartSync } from '@/features/cart';
import { LiveRegion, SkipLink } from '@/shared/ui';
import logoUrl from '@/assets/favicon.svg';

/**
 * After client-side navigation, move focus to the new page's <h1>. Otherwise focus stays on a link
 * that no longer exists and screen-reader users get no hint that the page changed. Comparing the
 * pathname (not "is first render") keeps this correct under StrictMode's double effects.
 */
function useRouteFocus() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    document.querySelector<HTMLElement>('main h1')?.focus();
  }, [pathname]);
}

export function Layout() {
  useRouteFocus();
  useCrossTabCartSync();
  const navigation = useNavigation();

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink targetId="main">Skip to main content</SkipLink>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <Link to="/" className="flex min-h-11 items-center gap-2 rounded-lg text-lg font-bold">
            <img src={logoUrl} alt="" width={28} height={28} />
            Storefront
          </Link>
          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                clsx(
                  'inline-flex min-h-11 items-center rounded-lg px-3 font-medium hover:bg-surface-muted',
                  isActive && 'underline underline-offset-4',
                )
              }
            >
              Products
            </NavLink>
            <CartBadge />
          </nav>
        </div>
        {navigation.state === 'loading' && (
          <div className="h-0.5 w-full bg-accent motion-safe:animate-pulse" aria-hidden="true" />
        )}
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 empty:hidden">
          <StorageNotice />
        </div>
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-ink-muted">
        © {new Date().getFullYear()} Storefront. All rights reserved.
      </footer>
      <LiveRegion />
    </div>
  );
}
