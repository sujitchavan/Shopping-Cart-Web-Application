import { useCallback, useMemo, useTransition } from 'react';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { DEFAULT_SORT, SORT_KEYS, type SortKey } from '../model/types';

export const MAX_QUERY_LENGTH = 100;
const MAX_PAGE = 10_000;

/**
 * Every param falls back silently to its default, so a hand-edited or malicious URL
 * (`?sort=evil&page=-4`) can never crash the page. Values are only ever used as plain text.
 */
export const CatalogParamsSchema = z.object({
  category: z.string().trim().min(1).max(100).nullable().catch(null),
  q: z
    .string()
    .catch('')
    .transform((value) => value.slice(0, MAX_QUERY_LENGTH)),
  sort: z.enum(SORT_KEYS).catch(DEFAULT_SORT),
  page: z.coerce.number().int().positive().max(MAX_PAGE).catch(1),
});

export interface CatalogParams {
  category: string | null;
  q: string;
  sort: SortKey;
  page: number;
}

export function parseCatalogParams(searchParams: URLSearchParams): CatalogParams {
  return CatalogParamsSchema.parse({
    category: searchParams.get('category'),
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
  if ('category' in patch) set('category', patch.category ?? null, patch.category === null);
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
    setParams({ category: null, q: '' });
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
