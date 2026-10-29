import { PLACEHOLDER_IMAGE } from '@/shared/lib/safeUrl';
import { rawCatalog } from '@/test/fixtures/catalog';
import { parseProductList, ProductSchema } from './productSchema';

const valid = {
  id: 1,
  title: 'Jacket',
  price: 55.99,
  description: 'Warm',
  category: "men's clothing",
  image: 'https://fakestoreapi.com/img/jacket.jpg',
  rating: { rate: 4.7, count: 500 },
};

describe('ProductSchema', () => {
  it('parses a valid product and converts the price to cents', () => {
    const product = ProductSchema.parse(valid);
    expect(product).toEqual({
      id: 1,
      title: 'Jacket',
      description: 'Warm',
      category: "men's clothing",
      image: 'https://fakestoreapi.com/img/jacket.jpg',
      rating: { rate: 4.7, count: 500 },
      priceCents: 5599,
    });
  });

  it('strips unknown keys, including __proto__', () => {
    const payload = JSON.parse(
      '{"id":1,"title":"A","price":1,"category":"c","image":"","__proto__":{"polluted":true},"extra":"x"}',
    ) as unknown;
    const product = ProductSchema.parse(payload);
    expect(Object.keys(product).sort()).toEqual(
      ['category', 'description', 'id', 'image', 'priceCents', 'rating', 'title'].sort(),
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('degrades a missing or invalid rating to null instead of failing', () => {
    expect(ProductSchema.parse({ ...valid, rating: null }).rating).toBeNull();
    expect(ProductSchema.parse({ ...valid, rating: undefined }).rating).toBeNull();
    expect(ProductSchema.parse({ ...valid, rating: { rate: 9, count: 1 } }).rating).toBeNull();
  });

  it('replaces unsafe image URLs with the placeholder', () => {
    expect(ProductSchema.parse({ ...valid, image: 'javascript:alert(1)' }).image).toBe(
      PLACEHOLDER_IMAGE,
    );
    expect(ProductSchema.parse({ ...valid, image: undefined }).image).toBe(PLACEHOLDER_IMAGE);
  });

  it('keeps HTML in titles as literal text (React escapes it on render)', () => {
    const product = ProductSchema.parse({ ...valid, title: '<img src=x onerror=alert(1)>' });
    expect(product.title).toBe('<img src=x onerror=alert(1)>');
  });

  it('defaults a missing description to empty', () => {
    expect(ProductSchema.parse({ ...valid, description: undefined }).description).toBe('');
  });

  it.each([
    ['string price', { price: 'abc' }],
    ['negative price', { price: -1 }],
    ['NaN price', { price: Number.NaN }],
    ['Infinity price', { price: Number.POSITIVE_INFINITY }],
    ['absurd price', { price: 1e12 }],
    ['zero id', { id: 0 }],
    ['fractional id', { id: 1.5 }],
    ['empty title', { title: '   ' }],
    ['huge title', { title: 'x'.repeat(301) }],
    ['missing category', { category: undefined }],
  ])('rejects a %s', (_label, override) => {
    expect(ProductSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});

describe('parseProductList', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('parses the fixture catalogue', () => {
    const result = parseProductList(rawCatalog);
    expect(result).toMatchObject({ ok: true, dropped: 0 });
  });

  it('fails on a non-array payload', () => {
    expect(parseProductList({ products: [] })).toEqual({
      ok: false,
      reason: expect.any(String) as string,
    });
    expect(parseProductList(null).ok).toBe(false);
  });

  it('drops invalid items, keeps the rest and logs the count', () => {
    const result = parseProductList([
      valid,
      { ...valid, id: 2, price: 'abc' },
      { ...valid, id: 3 },
    ]);
    expect(result).toMatchObject({ ok: true, dropped: 1 });
    expect(result.ok && result.products.map((p) => p.id)).toEqual([1, 3]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Dropped 1 invalid product'));
  });

  it('drops duplicate ids, keeping the first', () => {
    const result = parseProductList([valid, { ...valid, title: 'Duplicate' }]);
    expect(result.ok && result.products.map((p) => p.title)).toEqual(['Jacket']);
  });
});
