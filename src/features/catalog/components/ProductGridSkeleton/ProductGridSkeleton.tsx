import { PAGE_SIZE } from '../../model/types';
import { productGridClassName } from '../ProductGrid/ProductGrid';

/** Same grid and card size as the real thing, so nothing shifts when products arrive. */
export function ProductGridSkeleton({ count = PAGE_SIZE }: { count?: number }) {
  return (
    <div aria-busy="true" data-testid="product-grid-skeleton">
      <p className="sr-only">Loading products…</p>
      <div aria-hidden="true" className={productGridClassName}>
        {Array.from({ length: count }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-(--radius-card) border border-line p-4"
          >
            <div className="aspect-square w-full rounded-lg bg-surface-muted motion-safe:animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-surface-muted motion-safe:animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-surface-muted motion-safe:animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-surface-muted motion-safe:animate-pulse" />
            <div className="h-11 w-full rounded-lg bg-surface-muted motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
