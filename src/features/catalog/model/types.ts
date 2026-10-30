import type { Product } from '../api/productSchema';

export const SORT_KEYS = [
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
  'rating-desc',
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_SORT: SortKey = 'name-asc';
export const PAGE_SIZE = 12;

export const SORT_LABELS: Record<SortKey, string> = {
  'name-asc': 'Name: A to Z',
  'name-desc': 'Name: Z to A',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  'rating-desc': 'Rating: high to low',
};

/** What the UI asks the repository for. Shaped like a server-side search request on purpose. */
export interface CatalogQuery {
  /** Categories to include; empty means all. */
  categories: string[];
  q: string;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export interface CatalogPage {
  items: Product[];
  /** Matches after filtering, before pagination. */
  total: number;
  /** Total products in the catalogue, ignoring filters (tells "empty catalogue" from "no matches"). */
  catalogSize: number;
  /** The page actually served (clamped into range). */
  page: number;
  pageCount: number;
  pageSize: number;
  /** The categories actually applied, sorted. Unknown ones are dropped; empty means all. */
  selectedCategories: string[];
  /** Every category in the catalogue, sorted. */
  categories: string[];
}
