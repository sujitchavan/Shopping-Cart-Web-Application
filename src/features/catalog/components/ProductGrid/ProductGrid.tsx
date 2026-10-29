import { clsx } from 'clsx';
import type { Product } from '../../api/productSchema';
import { ProductCard } from '../ProductCard/ProductCard';

export const productGridClassName =
  'grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-4';

/** A real list, so screen readers announce "list, 12 items" and support list navigation. */
export function ProductGrid({
  products,
  dimmed = false,
}: {
  products: Product[];
  dimmed?: boolean;
}) {
  return (
    <ul
      aria-label="Products"
      className={clsx(
        productGridClassName,
        'transition-opacity motion-reduce:transition-none',
        dimmed && 'opacity-60',
      )}
    >
      {products.map((product) => (
        <li key={product.id} className="@container">
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
