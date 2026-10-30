import { useMemo } from 'react';
import { useGetCatalogPageQuery } from '../api/catalogApi';
import { PAGE_SIZE, type CatalogQuery } from '../model/types';
import { useCatalogParams } from './useCatalogParams';

/** URL params in, one catalogue page out. Components never talk to RTK Query directly. */
export function useCatalog() {
  const { params, setParams, clearFilters, hrefForPage, isPending } = useCatalogParams();

  const query = useMemo<CatalogQuery>(
    () => ({
      categories: params.categories,
      q: params.q.trim(),
      sort: params.sort,
      page: params.page,
      pageSize: PAGE_SIZE,
    }),
    [params],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetCatalogPageQuery(query);

  return {
    params,
    setParams,
    clearFilters,
    hrefForPage,
    page: data,
    isLoading,
    isError,
    /** Previous results stay on screen (dimmed) while new ones load. */
    isUpdating: isPending || (isFetching && !isLoading),
    retry: refetch,
  };
}
