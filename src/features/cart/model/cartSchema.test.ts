import { PLACEHOLDER_IMAGE } from '@/shared/lib/safeUrl';
import { makeCart, makeLine } from '@/test/fixtures/cart';
import {
  CART_VERSION,
  migrateCart,
  parseCart,
  parsePersistedCart,
  sanitizeLines,
  serializeCart,
} from './cartSchema';
import { MAX_CART_LINES, MAX_PERSISTED_BYTES, MAX_QTY_PER_LINE } from './policies';

const persisted = (lines: unknown, version: unknown = CART_VERSION) =>
  JSON.stringify({ version, state: { lines } });

describe('parseCart', () => {
  it('round-trips a valid v1 cart', () => {
    const cart = makeCart(makeLine(1, { quantity: 2 }), makeLine(5));
    expect(parseCart(serializeCart(cart))).toEqual(cart);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['malformed JSON', '{"version":1,'],
    ['a JSON array', '[]'],
    ['a JSON number', '42'],
    ['a missing state', '{"version":1}'],
    ['lines as an array', persisted([makeLine(1)])],
    ['lines as a string', persisted('nope')],
  ])('gives an empty cart for %s', (_label, raw) => {
    expect(parseCart(raw)).toEqual({ lines: {} });
  });

  it('rejects payloads over the size cap', () => {
    const huge = persisted({
      1: {
        ...makeLine(1),
        snapshot: { ...makeLine(1).snapshot, title: 'x'.repeat(MAX_PERSISTED_BYTES) },
      },
    });
    expect(parseCart(huge)).toEqual({ lines: {} });
  });

  it('drops invalid lines one by one and keeps the rest', () => {
    const raw = persisted({
      1: makeLine(1),
      2: { ...makeLine(2), productId: -2 },
      3: { ...makeLine(3), snapshot: { title: '', image: '', priceCents: 1 } },
      4: { ...makeLine(4), quantity: 'lots' },
      5: 'garbage',
      6: makeLine(6),
    });
    expect(Object.keys(parseCart(raw).lines)).toEqual(['1', '6']);
  });

  it('clamps quantities into range', () => {
    const raw = persisted({ 1: makeLine(1, { quantity: -5 }), 2: makeLine(2, { quantity: 9999 }) });
    const cart = parseCart(raw);
    expect(cart.lines[1]?.quantity).toBe(1);
    expect(cart.lines[2]?.quantity).toBe(MAX_QTY_PER_LINE);
  });

  it('re-derives keys from productId and ignores __proto__ keys', () => {
    const raw = `{"version":1,"state":{"lines":{"__proto__":{"polluted":true},"999":${JSON.stringify(makeLine(4))}}}}`;
    const cart = parseCart(raw);
    expect(Object.keys(cart.lines)).toEqual(['4']);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(cart.lines)).toBe(Object.prototype);
  });

  it('keeps only the first line for duplicate product ids', () => {
    const raw = persisted({ a: makeLine(1, { quantity: 2 }), b: makeLine(1, { quantity: 5 }) });
    expect(parseCart(raw).lines[1]?.quantity).toBe(2);
  });

  it('re-sanitises stored image URLs', () => {
    const raw = persisted({
      1: { ...makeLine(1), snapshot: { ...makeLine(1).snapshot, image: 'javascript:alert(1)' } },
    });
    expect(parseCart(raw).lines[1]?.snapshot.image).toBe(PLACEHOLDER_IMAGE);
  });

  it('drops lines that are out of stock', () => {
    const raw = persisted({
      1: { ...makeLine(1), snapshot: { ...makeLine(1).snapshot, stock: 0 } },
    });
    expect(parseCart(raw)).toEqual({ lines: {} });
  });

  it('caps the number of lines', () => {
    const lines = Object.fromEntries(
      Array.from({ length: MAX_CART_LINES + 5 }, (_, i) => [i + 1, makeLine(i + 1)]),
    );
    expect(Object.keys(parseCart(persisted(lines)).lines)).toHaveLength(MAX_CART_LINES);
  });

  it('resets on an unknown future version', () => {
    expect(parseCart(persisted({ 1: makeLine(1) }, 99))).toEqual({ lines: {} });
  });

  it('resets an older version with no migration path', () => {
    expect(parseCart(persisted({ 1: makeLine(1) }, 0))).toEqual({ lines: {} });
  });

  it('resets when the version is not a number', () => {
    expect(parseCart(persisted({ 1: makeLine(1) }, '1'))).toEqual({ lines: {} });
  });
});

describe('migrateCart', () => {
  it('passes the current version through unchanged', () => {
    expect(migrateCart(CART_VERSION, { lines: {} })).toEqual({
      version: CART_VERSION,
      state: { lines: {} },
    });
  });

  it('returns null for versions it cannot migrate', () => {
    expect(migrateCart(CART_VERSION + 1, {})).toBeNull();
    expect(migrateCart(0, {})).toBeNull();
  });
});

describe('parsePersistedCart / sanitizeLines', () => {
  it('accepts an already-parsed object', () => {
    expect(
      parsePersistedCart({ version: 1, state: { lines: { 1: makeLine(1) } } }).lines[1]?.productId,
    ).toBe(1);
  });

  it('returns empty for non-object lines', () => {
    expect(sanitizeLines(null)).toEqual({ lines: {} });
    expect(sanitizeLines(7)).toEqual({ lines: {} });
  });
});
