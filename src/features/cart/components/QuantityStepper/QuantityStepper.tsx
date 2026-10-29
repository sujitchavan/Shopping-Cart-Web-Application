import { useEffect, useId, useRef } from 'react';
import { Button } from '@/shared/ui';

interface QuantityStepperProps {
  title: string;
  quantity: number;
  max: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Focus "+" on mount: used when "Add to cart" turns into this stepper, so focus is not lost. */
  autoFocusIncrement?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Limits use `aria-disabled` (not `disabled`) so the buttons stay focusable and announce why they
 * do nothing. Clicks at a limit are ignored here, and the reducer clamps as well.
 */
export function QuantityStepper({
  title,
  quantity,
  max,
  onIncrement,
  onDecrement,
  autoFocusIncrement = false,
  size = 'md',
}: QuantityStepperProps) {
  const hintId = useId();
  const incrementRef = useRef<HTMLButtonElement>(null);
  const atMin = quantity <= 1;
  const atMax = quantity >= max;

  useEffect(() => {
    if (autoFocusIncrement) incrementRef.current?.focus();
  }, [autoFocusIncrement]);

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        role="group"
        aria-label={`Quantity for ${title}`}
        className="inline-flex items-center rounded-lg border border-line-strong"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Decrease quantity of ${title}`}
          aria-disabled={atMin}
          onClick={() => {
            if (!atMin) onDecrement();
          }}
        >
          <MinusIcon />
        </Button>
        <output
          aria-live="polite"
          className={
            size === 'sm'
              ? 'min-w-8 text-center text-sm font-semibold'
              : 'min-w-10 text-center font-semibold'
          }
        >
          {quantity}
        </output>
        <Button
          ref={incrementRef}
          variant="ghost"
          size="icon"
          aria-label={`Increase quantity of ${title}`}
          aria-disabled={atMax}
          aria-describedby={atMax ? hintId : undefined}
          onClick={() => {
            if (!atMax) onIncrement();
          }}
        >
          <PlusIcon />
        </Button>
      </div>
      {atMax && (
        <p id={hintId} className="text-xs text-ink-muted">
          Max {max} per order
        </p>
      )}
    </div>
  );
}

function MinusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
      <path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5">
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}
