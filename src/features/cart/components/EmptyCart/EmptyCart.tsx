import type { Ref } from 'react';
import { Link } from 'react-router';
import { buttonClassName, EmptyState } from '@/shared/ui';

export function EmptyCart({ headingRef }: { headingRef?: Ref<HTMLHeadingElement> }) {
  return (
    <EmptyState
      headingRef={headingRef}
      title="Your cart is empty"
      message="Browse the catalogue and add something you like."
      action={
        <Link to="/" className={buttonClassName()}>
          Continue shopping
        </Link>
      }
    />
  );
}
