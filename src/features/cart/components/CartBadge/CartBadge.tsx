import { NavLink } from 'react-router';
import { clsx } from 'clsx';
import { pluralize } from '@/shared/lib/pluralize';
import { useCartCount } from '../../hooks/useCart';

export function CartBadge() {
  const count = useCartCount();
  return (
    <NavLink
      to="/cart"
      aria-label={`Cart, ${pluralize(count, 'item')}`}
      className={({ isActive }) =>
        clsx(
          'relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-surface-muted',
          isActive && 'bg-surface-muted',
        )
      }
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
        />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          data-testid="cart-count"
          className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-xs leading-5 font-bold text-on-accent"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </NavLink>
  );
}
