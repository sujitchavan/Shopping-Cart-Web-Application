import { memo } from 'react';
import { AddToCartButton } from '@/features/cart';
import { formatCents } from '@/shared/lib/money';
import type { Product } from '../../api/productSchema';
import { RatingStars } from '../RatingStars/RatingStars';

/**
 * Lays itself out from its own width (container queries), so the same card works in a grid,
 * a sidebar or a carousel. Memoised: adding to cart re-renders only that card's button.
 */
export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const titleId = `product-${product.id}-title`;
  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col gap-4 rounded-(--radius-card) border border-line bg-surface p-4 @sm:flex-row"
    >
      {/* alt="" because the title right next to it already names the product. */}
      <img
        src={product.image}
        alt=""
        width={200}
        height={200}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="aspect-square w-full rounded-lg bg-image object-contain p-4 @sm:w-40 @sm:shrink-0"
      />
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {product.category}
        </p>
        <h3 id={titleId} className="line-clamp-2 font-semibold" title={product.title}>
          {product.title}
        </h3>
        <RatingStars rating={product.rating} />
        <p className="mt-auto pt-2 text-lg font-bold">{formatCents(product.priceCents)}</p>
        <AddToCartButton
          productId={product.id}
          snapshot={{ title: product.title, image: product.image, priceCents: product.priceCents }}
        />
      </div>
    </article>
  );
});
