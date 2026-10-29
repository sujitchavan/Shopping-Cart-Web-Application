import { makeProduct, parsedCatalog } from '@/test/fixtures/catalog';
import {
  buildCatalogPage,
  filterByCategory,
  getCategories,
  paginate,
  searchProducts,
  sortProducts,
} from './filterSort';
import type { CatalogQuery } from './types';

const catalog = parsedCatalog();
const ids = (products: { id: number }[]) => products.map((p) => p.id);

const query = (overrides: Partial<CatalogQuery> = {}): CatalogQuery => ({
  category: null,
  q: '',
  sort: 'name-asc',
  page: 1,
  pageSize: 12,
  ...overrides,
});

describe('getCategories', () => {
  it('returns unique categories in a stable order', () => {
    expect(getCategories(catalog)).toEqual([
      'electronics',
      'jewelery',
      "men's clothing",
      "women's clothing",
    ]);
  });
});

describe('filterByCategory', () => {
  it('returns a copy of everything for null', () => {
    const all = filterByCategory(catalog, null);
    expect(all).toHaveLength(14);
    expect(all).not.toBe(catalog);
  });

  it('keeps only the matching category', () => {
    expect(ids(filterByCategory(catalog, 'electronics'))).toEqual([8, 9, 10, 11]);
  });
});

describe('searchProducts', () => {
  it('ignores case and surrounding whitespace', () => {
    expect(ids(searchProducts(catalog, '  JACKET '))).toEqual([3, 12]);
  });

  it('matches the category too', () => {
    expect(searchProducts(catalog, 'jewel')).toHaveLength(3);
  });

  it('treats regex characters literally', () => {
    expect(searchProducts(catalog, '.*')).toEqual([]);
    expect(() => searchProducts(catalog, '(')).not.toThrow();
  });

  it('returns everything for an empty query', () => {
    expect(searchProducts(catalog, '   ')).toHaveLength(14);
  });
});

describe('sortProducts', () => {
  it('sorts by price and breaks ties on id', () => {
    const sorted = sortProducts(catalog, 'price-asc');
    expect(ids(sorted.slice(0, 3))).toEqual([7, 14, 4]);
    expect(ids(sortProducts(catalog, 'price-desc').slice(0, 2))).toEqual([5, 11]);
  });

  it('sorts by rating (highest first), ties on id', () => {
    const sorted = sortProducts(catalog, 'rating-desc');
    expect(ids(sorted.slice(0, 3))).toEqual([10, 3, 14]);
  });

  it('puts unrated products last', () => {
    const products = [
      makeProduct({ id: 1, rating: null }),
      makeProduct({ id: 2, rating: { rate: 1, count: 1 } }),
    ];
    expect(ids(sortProducts(products, 'rating-desc'))).toEqual([2, 1]);
  });

  it('sorts names numerically and case-insensitively', () => {
    const products = [
      makeProduct({ id: 1, title: 'Item 10' }),
      makeProduct({ id: 2, title: 'item 2' }),
      makeProduct({ id: 3, title: 'Item 1' }),
    ];
    expect(ids(sortProducts(products, 'name-asc'))).toEqual([3, 2, 1]);
    expect(ids(sortProducts(products, 'name-desc'))).toEqual([1, 2, 3]);
  });

  it('is stable for equal names (tie on id)', () => {
    const products = [makeProduct({ id: 9, title: 'Same' }), makeProduct({ id: 3, title: 'same' })];
    expect(ids(sortProducts(products, 'name-asc'))).toEqual([3, 9]);
  });

  it('does not mutate its input', () => {
    const input = [...catalog];
    sortProducts(input, 'price-desc');
    expect(input).toEqual(catalog);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it.each([
    [1, [1, 12], 1],
    [3, [25, 25], 3],
    [99, [25, 25], 3],
    [0, [1, 12], 1],
    [-4, [1, 12], 1],
    [Number.NaN, [1, 12], 1],
    [2.7, [13, 24], 2],
  ])('page %d → items %j, served page %d', (page, [first, last], served) => {
    const result = paginate(items, page, 12);
    expect(result.items[0]).toBe(first);
    expect(result.items.at(-1)).toBe(last);
    expect(result.page).toBe(served);
    expect(result.pageCount).toBe(3);
  });

  it('treats an empty list as one empty page', () => {
    expect(paginate([], 5, 12)).toEqual({ items: [], page: 1, pageCount: 1 });
  });

  it('guards against a zero page size', () => {
    expect(paginate([1, 2], 1, 0).pageCount).toBe(2);
  });
});

describe('buildCatalogPage', () => {
  it('combines category, search, sort and pagination', () => {
    const page = buildCatalogPage(
      catalog,
      query({ category: "women's clothing", q: 'womens', sort: 'price-desc' }),
    );
    expect(ids(page.items)).toEqual([12, 13, 14]);
    expect(page).toMatchObject({
      total: 3,
      catalogSize: 14,
      page: 1,
      pageCount: 1,
      category: "women's clothing",
    });
  });

  it('falls back to all categories for an unknown category', () => {
    const page = buildCatalogPage(catalog, query({ category: 'evil<script>' }));
    expect(page.category).toBeNull();
    expect(page.total).toBe(14);
  });

  it('clamps a page beyond the last page', () => {
    const page = buildCatalogPage(catalog, query({ page: 50 }));
    expect(page.page).toBe(2);
    expect(page.items).toHaveLength(2);
  });

  it('reports no matches separately from an empty catalogue', () => {
    expect(buildCatalogPage(catalog, query({ q: 'zzz' }))).toMatchObject({
      total: 0,
      catalogSize: 14,
    });
    expect(buildCatalogPage([], query())).toMatchObject({
      total: 0,
      catalogSize: 0,
      categories: [],
    });
  });
});
