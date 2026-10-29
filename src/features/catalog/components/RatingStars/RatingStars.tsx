import type { ProductRating } from '../../api/productSchema';

/** Stars are decorative; screen readers get one sentence instead of five glyphs. */
export function RatingStars({ rating }: { rating: ProductRating | null }) {
  if (!rating) {
    return <p className="text-sm text-ink-muted">No ratings</p>;
  }
  const filled = Math.round(rating.rate);
  const reviews = rating.count === 1 ? 'review' : 'reviews';
  return (
    <p className="flex items-center gap-1 text-sm">
      <span aria-hidden="true" className="flex text-star">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            viewBox="0 0 20 20"
            className="size-4"
            fill={star <= filled ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              d="M10 1.75l2.55 5.17 5.7.83-4.12 4.02.97 5.68L10 14.77l-5.1 2.68.97-5.68L1.75 7.75l5.7-.83L10 1.75z"
              strokeLinejoin="round"
            />
          </svg>
        ))}
      </span>
      <span aria-hidden="true" className="text-ink-muted">
        {rating.rate.toFixed(1)} ({rating.count})
      </span>
      <span className="sr-only">
        Rated {rating.rate.toFixed(1)} out of 5, {rating.count} {reviews}
      </span>
    </p>
  );
}
