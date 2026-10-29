import { z } from 'zod';
import { logger } from '@/shared/lib/logger';
import { toCents } from '@/shared/lib/money';
import { safeImageUrl } from '@/shared/lib/safeUrl';

/** Guards against absurd values (and float overflow) from a misbehaving API. */
const MAX_PRICE = 1_000_000;

const RatingSchema = z.object({
  rate: z.number().min(0).max(5),
  count: z.number().int().nonnegative(),
});

/**
 * The API boundary. Unknown keys are stripped (so `__proto__` and friends never reach the app),
 * strings are length-capped, the price becomes integer cents, and the image URL is allow-listed.
 */
export const ProductSchema = z
  .object({
    id: z.number().int().positive(),
    title: z.string().trim().min(1).max(300),
    price: z.number().nonnegative().max(MAX_PRICE),
    description: z.string().trim().max(5000).catch(''),
    category: z.string().trim().min(1).max(100),
    image: z.unknown().transform((value) => safeImageUrl(value)),
    rating: RatingSchema.nullable().catch(null),
  })
  .transform(({ price, ...product }) => ({ ...product, priceCents: toCents(price) }));

export type Product = z.output<typeof ProductSchema>;
export type ProductRating = z.output<typeof RatingSchema>;

export type ProductListResult =
  { ok: true; products: Product[]; dropped: number } | { ok: false; reason: string };

/**
 * Partial-failure policy: a non-array payload is an error, but individual invalid products are
 * dropped (and logged) so one bad record cannot hide the whole catalogue. Duplicate ids keep the
 * first occurrence.
 */
export function parseProductList(payload: unknown): ProductListResult {
  if (!Array.isArray(payload)) {
    return { ok: false, reason: 'Expected an array of products' };
  }
  const products: Product[] = [];
  const seen = new Set<number>();
  let dropped = 0;
  for (const item of payload) {
    const result = ProductSchema.safeParse(item);
    if (result.success && !seen.has(result.data.id)) {
      seen.add(result.data.id);
      products.push(result.data);
    } else {
      dropped += 1;
    }
  }
  if (dropped > 0) {
    logger.warn(`Dropped ${dropped} invalid product(s) from the catalogue response.`);
  }
  return { ok: true, products, dropped };
}
