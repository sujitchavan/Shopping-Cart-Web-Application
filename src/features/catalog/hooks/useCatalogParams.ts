import { useCallback, useMemo, useTransition } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { DEFAULT_SORT, SORT_KEYS, type SortKey } from '../model/types';

export const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 10_000;
const MAX_CATEGORIES = 20;
const MAX_CATEGORY_LENGTH = 100;

/** Trimmed, de-duplicated and sorted, so one selection always has one URL (and one cache key). */
function canonicalCategories(values: readonly string[]): string[] {
  const valid = values
    .map((value) => value.trim())
    .filter((value) => value !== '' && value.length <= MAX_CATEGORY_LENGTH);
  return [...new Set(valid)].sort().slice(0, MAX_CATEGORIES);
}

/**
 * Every param falls back silently to its default, so a hand-edited or malicious URL
 * (`?sort=evil&page=-4`) can never crash the page. Values are only ever used as plain text.
 * Categories repeat (`?category=a&category=b`); bad entries are dropped one by one.
 */
export const CatalogParamsSchema = z.object({
  categories: z.array(z.string()).catch([]).transform(canonicalCategories),
  q: z
    .string()
    .catch('')
    .transform((value) => value.slice(0, MAX_QUERY_LENGTH)),
  sort: z.enum(SORT_KEYS).catch(DEFAULT_SORT),
  page: z.coerce.number().int().positive().max(MAX_PAGE).catch(1),
});

export interface CatalogParams {
  /** Empty means all categories. */
  categories: string[];
  q: string;
  sort: SortKey;
  page: number;
}

export function parseCatalogParams(searchParams: URLSearchParams): CatalogParams {
  return CatalogParamsSchema.parse({
    categories: searchParams.getAll('category'),
    q: searchParams.get('q') ?? '',
    sort: searchParams.get('sort') ?? DEFAULT_SORT,
    page: searchParams.get('page') ?? 1,
  });
}

/** Writes only non-default values, so URLs stay short and canonical. */
export function applyCatalogParams(
  current: URLSearchParams,
  patch: Partial<CatalogParams>,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const set = (key: string, value: string | null, isDefault: boolean) => {
    if (value === null || isDefault) next.delete(key);
    else next.set(key, value);
  };
  if ('categories' in patch) {
    next.delete('category');
    for (const category of canonicalCategories(patch.categories ?? [])) {
      next.append('category', category);
    }
  }
  if ('q' in patch) {
    const q = (patch.q ?? '').trim().slice(0, MAX_QUERY_LENGTH);
    set('q', q, q === '');
  }
  if ('sort' in patch) set('sort', patch.sort ?? null, patch.sort === DEFAULT_SORT);
  // Any filter change resets pagination; an explicit page wins.
  if ('page' in patch) set('page', String(patch.page ?? 1), (patch.page ?? 1) <= 1);
  else next.delete('page');
  return next;
}

export function useCatalogParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const params = useMemo(() => parseCatalogParams(searchParams), [searchParams]);

  const setParams = useCallback(
    (patch: Partial<CatalogParams>, options: { replace?: boolean } = {}) => {
      startTransition(() => {
        setSearchParams((current) => applyCatalogParams(current, patch), {
          replace: options.replace ?? false,
        });
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setParams({ categories: [], q: '' });
  }, [setParams]);

  const hrefForPage = useCallback(
    (page: number) => {
      const next = applyCatalogParams(searchParams, { page });
      const query = next.toString();
      return query === '' ? '?' : `?${query}`;
    },
    [searchParams],
  );

  return { params, setParams, clearFilters, hrefForPage, isPending };
}
