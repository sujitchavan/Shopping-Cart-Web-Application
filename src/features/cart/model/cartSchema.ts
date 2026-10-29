import { z } from 'zod';
import { safeImageUrl } from '@/shared/lib/safeUrl';
import { clampQuantity, MAX_CART_LINES, MAX_PERSISTED_BYTES, maxQuantityFor } from './policies';

/** What the cart remembers about a product when it is added (renders before the catalogue loads). */
export const ProductSnapshotSchema = z.object({
  title: z.string().trim().min(1).max(300),
  image: z.unknown().transform((value) => safeImageUrl(value)),
  priceCents: z.number().int().nonnegative().max(100_000_000),
  stock: z.number().int().nonnegative().optional(),
});

export const CartLineSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int(),
  addedAt: z.number().int().nonnegative(),
  snapshot: ProductSnapshotSchema,
});

export type ProductSnapshot = z.output<typeof ProductSnapshotSchema>;
export type CartLine = z.output<typeof CartLineSchema>;

export interface CartState {
  /** Keyed by productId, so a product can never appear on two lines. */
  lines: Record<number, CartLine>;
}

export const CART_VERSION = 1;

const PersistedCartV1Schema = z.object({
  version: z.literal(1),
  state: z.object({ lines: z.unknown() }),
});

/** Discriminated on `version`; add `PersistedCartV2Schema` here when the shape changes. */
export const PersistedCartSchema = z.discriminatedUnion('version', [PersistedCartV1Schema]);

const VersionEnvelopeSchema = z.object({ version: z.number().int(), state: z.unknown() });

/**
 * Upgrades older payloads step by step. Register `migrations[n]` (vN state → vN+1 state) when
 * bumping CART_VERSION. Returns null when no path exists, which resets the cart.
 */
const migrations: Partial<Record<number, (state: unknown) => unknown>> = {};

export function migrateCart(version: number, state: unknown): unknown {
  if (version > CART_VERSION) return null;
  let current = state;
  for (let from = version; from < CART_VERSION; from += 1) {
    const step = migrations[from];
    if (!step) return null;
    current = step(current);
  }
  return { version: CART_VERSION, state: current };
}

export const emptyCart = (): CartState => ({ lines: {} });

/**
 * Validates each line on its own: invalid lines are dropped, quantities are clamped, and keys are
 * re-derived from the validated productId (raw keys such as "__proto__" are never copied).
 */
export function sanitizeLines(raw: unknown): CartState {
  const cart = emptyCart();
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return cart;

  let count = 0;
  for (const candidate of Object.values(raw)) {
    if (count >= MAX_CART_LINES) break;
    const parsed = CartLineSchema.safeParse(candidate);
    if (!parsed.success) continue;
    const line = parsed.data;
    const quantity = clampQuantity(line.quantity, maxQuantityFor(line.snapshot));
    if (quantity === null || line.productId in cart.lines) continue;
    cart.lines[line.productId] = { ...line, quantity };
    count += 1;
  }
  return cart;
}

export function parsePersistedCart(data: unknown): CartState {
  const current = PersistedCartSchema.safeParse(data);
  if (current.success) return sanitizeLines(current.data.state.lines);

  const envelope = VersionEnvelopeSchema.safeParse(data);
  if (!envelope.success || envelope.data.version === CART_VERSION) return emptyCart();

  const migrated = PersistedCartSchema.safeParse(
    migrateCart(envelope.data.version, envelope.data.state),
  );
  return migrated.success ? sanitizeLines(migrated.data.state.lines) : emptyCart();
}

/** Never throws: malformed, oversized or tampered input gives an empty (or partial) cart. */
export function parseCart(raw: string | null | undefined): CartState {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_PERSISTED_BYTES) {
    return emptyCart();
  }
  try {
    return parsePersistedCart(JSON.parse(raw));
  } catch {
    return emptyCart();
  }
}

export function serializeCart(state: CartState): string {
  return JSON.stringify({ version: CART_VERSION, state });
}
