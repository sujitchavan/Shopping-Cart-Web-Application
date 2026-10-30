import type { Product } from '../api/productSchema';
import type { CatalogPage, CatalogQuery, SortKey } from './types';

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export function getCategories(products: readonly Product[]): string[] {
  return [...new Set(products.map((product) => product.category))].sort(collator.compare);
}

/** An empty selection means all categories. */
export function filterByCategory(
  products: readonly Product[],
  categories: readonly string[],
): Product[] {
  if (categories.length === 0) return [...products];
  const selected = new Set(categories);
  return products.filter((p) => selected.has(p.category));
}

/**
 * Drops unknown categories and duplicates and sorts the rest, so one selection always gives one
 * query (and one cache key). Selecting every category is the same as selecting none.
 */
export function normalizeCategories(
  selected: readonly string[],
  available: readonly string[],
): string[] {
  const known = new Set(available);
  const result = [...new Set(selected)].filter((c) => known.has(c)).sort(collator.compare);
  return result.length === known.size ? [] : result;
}

/** Adds the category if it is not selected, removes it if it is. */
export function toggleCategory(selected: readonly string[], category: string): string[] {
  return selected.includes(category)
    ? selected.filter((c) => c !== category)
    : [...selected, category];
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
  const selectedCategories = normalizeCategories(query.categories, categories);
  const filtered = searchProducts(filterByCategory(products, selectedCategories), query.q);
  const sorted = sortProducts(filtered, query.sort);
  const { items, page, pageCount } = paginate(sorted, query.page, query.pageSize);
  return {
    items,
    total: sorted.length,
    catalogSize: products.length,
    page,
    pageCount,
    pageSize: query.pageSize,
    selectedCategories,
    categories,
  };
}
