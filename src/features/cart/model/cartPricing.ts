import { multiplyCents, sumCents, type Cents } from '@/shared/lib/money';
import type { CartLine } from './cartSchema';
import { maxQuantityFor } from './policies';

/** The minimum the cart needs to know about a live catalogue product. */
export interface LiveProductPrice {
  id: number;
  title: string;
  image: string;
  priceCents: Cents;
}

export interface PricedCartLine {
  productId: number;
  quantity: number;
  maxQuantity: number;
  title: string;
  image: string;
  /** Live catalogue price when known, otherwise the price captured when the item was added. */
  unitCents: Cents;
  lineTotalCents: Cents;
  /** Price captured when the item was added. */
  snapshotCents: Cents;
  priceChanged: boolean;
  /** The catalogue loaded and this product is no longer in it. */
  unavailable: boolean;
}

/**
 * Joins cart lines with the live catalogue. `catalog` is undefined while the catalogue is not
 * loaded (or failed), in which case snapshot prices are used and nothing is flagged unavailable.
 */
export function priceCartLines(
  lines: readonly CartLine[],
  catalog: readonly LiveProductPrice[] | undefined,
): PricedCartLine[] {
  const byId = catalog ? new Map(catalog.map((product) => [product.id, product])) : undefined;
  return lines.map((line) => {
    const live = byId?.get(line.productId);
    const unavailable = byId !== undefined && live === undefined;
    const unitCents = live?.priceCents ?? line.snapshot.priceCents;
    return {
      productId: line.productId,
      quantity: line.quantity,
      maxQuantity: maxQuantityFor(line.snapshot),
      title: live?.title ?? line.snapshot.title,
      image: live?.image ?? line.snapshot.image,
      unitCents,
      lineTotalCents: multiplyCents(unitCents, line.quantity),
      snapshotCents: line.snapshot.priceCents,
      priceChanged: live !== undefined && live.priceCents !== line.snapshot.priceCents,
      unavailable,
    };
  });
}

/** Unavailable lines are excluded: a product that no longer exists cannot be charged. */
export function cartSubtotalCents(lines: readonly PricedCartLine[]): Cents {
  return sumCents(lines.filter((line) => !line.unavailable).map((line) => line.lineTotalCents));
}

export function payableItemCount(lines: readonly PricedCartLine[]): number {
  return lines.reduce((count, line) => (line.unavailable ? count : count + line.quantity), 0);
}
