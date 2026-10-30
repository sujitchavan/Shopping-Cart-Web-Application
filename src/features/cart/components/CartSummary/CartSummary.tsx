import type { ReactNode } from 'react';
import { formatCents } from '@/shared/lib/money';
import { pluralize } from '@/shared/lib/pluralize';

interface CartSummaryProps {
  itemCount: number;
  subtotalCents: number;
  children?: ReactNode;
}

export function CartSummary({ itemCount, subtotalCents, children }: CartSummaryProps) {
  return (
    <section
      aria-labelledby="cart-summary-heading"
      className="flex flex-col gap-4 rounded-(--radius-card) border border-line bg-surface-muted p-5 lg:sticky lg:top-4"
    >
      <h2 id="cart-summary-heading" className="text-lg font-semibold">
        Order summary
      </h2>
      <dl className="grid grid-cols-[1fr_auto] gap-y-2">
        <dt className="text-ink-muted">Items</dt>
        <dd data-testid="summary-count">{pluralize(itemCount, 'item')}</dd>
        <dt className="text-lg font-semibold">Subtotal</dt>
        <dd className="text-lg font-semibold" data-testid="subtotal">
          {formatCents(subtotalCents)}
        </dd>
      </dl>
      <p className="text-sm text-ink-muted">Taxes and shipping are calculated at checkout.</p>
      {children}
    </section>
  );
}
