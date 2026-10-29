import type { Product } from '../api/productSchema';
import type { CatalogPage, CatalogQuery, SortKey } from './types';

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export function getCategories(products: readonly Product[]): string[] {
  return [...new Set(products.map((product) => product.category))].sort(collator.compare);
}

export function filterByCategory(products: readonly Product[], category: string | null): Product[] {
  return category === null ? [...products] : products.filter((p) => p.category === category);
}

/** Plain, case-insensitive substring match. The query is never turned into a RegExp. */
export function searchProducts(products: readonly Product[], query: string): Product[] {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === '') return [...products];
  return products.filter(
    (p) =>
      p.title.toLocaleLowerCase().includes(needle) ||
      p.category.toLocaleLowerCase().includes(needle),
  );
}

type Comparator = (a: Product, b: Product) => number;

const comparators: Record<SortKey, Comparator> = {
  'name-asc': (a, b) => collator.compare(a.title, b.title),
  'name-desc': (a, b) => collator.compare(b.title, a.title),
  'price-asc': (a, b) => a.priceCents - b.priceCents,
  'price-desc': (a, b) => b.priceCents - a.priceCents,
  // Unrated products always sort last.
  'rating-desc': (a, b) => (b.rating?.rate ?? -1) - (a.rating?.rate ?? -1),
};

/** Returns a new array. Ties always break on id, so order (and pagination) is deterministic. */
export function sortProducts(products: readonly Product[], key: SortKey): Product[] {
  const compare = comparators[key];
  return [...products].sort((a, b) => compare(a, b) || a.id - b.id);
}

export interface PageSlice<T> {
  items: T[];
  page: number;
  pageCount: number;
}

/** Clamps `page` into [1, pageCount]; an empty list is a single empty page. */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): PageSlice<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const safePage = Number.isFinite(page) ? Math.min(Math.max(1, Math.floor(page)), pageCount) : 1;
  const start = (safePage - 1) * size;
  return { items: items.slice(start, start + size), page: safePage, pageCount };
}

/** The whole pipeline: category → search → sort → paginate. */
export function buildCatalogPage(products: readonly Product[], query: CatalogQuery): CatalogPage {
  const categories = getCategories(products);
  const category =
    query.category !== null && categories.includes(query.category) ? query.category : null;
  const filtered = searchProducts(filterByCategory(products, category), query.q);
  const sorted = sortProducts(filtered, query.sort);
  const { items, page, pageCount } = paginate(sorted, query.page, query.pageSize);
  return {
    items,
    total: sorted.length,
    catalogSize: products.length,
    page,
    pageCount,
    pageSize: query.pageSize,
    category,
    categories,
  };
}
