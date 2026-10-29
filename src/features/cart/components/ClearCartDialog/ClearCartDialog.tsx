import { useId, useRef } from 'react';
import { Button } from '@/shared/ui';

/**
 * Native <dialog> + showModal(): built-in focus trap, Esc to close, inert background, and focus
 * returns to the trigger on close. No dialog library needed.
 */
export function ClearCartDialog({ onConfirm }: { onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button variant="secondary" className="w-full" onClick={() => dialogRef.current?.showModal()}>
        Clear cart
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-(--radius-card) bg-surface p-6 text-ink shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Clear your cart?
        </h2>
        <p id={descriptionId} className="mt-2 text-ink-muted">
          This removes every item from your cart. You can&apos;t undo this.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {/* First focusable element, so Enter on open cancels rather than destroys. */}
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              close();
              onConfirm();
            }}
          >
            Clear cart
          </Button>
        </div>
      </dialog>
    </>
  );
}
