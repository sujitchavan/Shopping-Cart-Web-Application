import type { Ref } from 'react';
import { formatCents } from '@/shared/lib/money';
import { Button } from '@/shared/ui';
import type { PricedCartLine } from '../../model/cartPricing';
import { QuantityStepper } from '../QuantityStepper/QuantityStepper';

interface CartLineItemProps {
  line: PricedCartLine;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  removeButtonRef?: Ref<HTMLButtonElement>;
}

export function CartLineItem({
  line,
  onIncrement,
  onDecrement,
  onRemove,
  removeButtonRef,
}: CartLineItemProps) {
  const titleId = `cart-line-${line.productId}-title`;
  return (
    <article
      aria-labelledby={titleId}
      className="flex gap-4 border-b border-line py-4 last:border-b-0"
    >
      <img
        src={line.image}
        alt=""
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="aspect-square size-20 shrink-0 rounded-lg bg-image object-contain p-2 sm:size-24"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <h3 id={titleId} className="font-medium">
            {line.title}
          </h3>
          {!line.unavailable && (
            <p className="font-semibold" data-testid="line-total">
              <span className="sr-only">Line total: </span>
              {formatCents(line.lineTotalCents)}
            </p>
          )}
        </div>

        {line.unavailable ? (
          <p className="text-sm font-medium text-danger">
            No longer available. It is not included in your total.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            {formatCents(line.unitCents)} each
            {line.priceChanged && (
              <span className="ml-2 font-medium text-ink">
                (price updated from {formatCents(line.snapshotCents)})
              </span>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {!line.unavailable && (
            <QuantityStepper
              size="sm"
              title={line.title}
              quantity={line.quantity}
              max={line.maxQuantity}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
            />
          )}
          <Button
            ref={removeButtonRef}
            variant="ghost"
            size="sm"
            aria-label={`Remove ${line.title} from cart`}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    </article>
  );
}
