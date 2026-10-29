import {
  createApi,
  fetchBaseQuery,
  retry,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { env } from '@/shared/config/env';
import { buildCatalogPage } from '../model/filterSort';
import type { CatalogPage, CatalogQuery } from '../model/types';
import { parseProductList, type Product } from './productSchema';

const MAX_RETRIES = 2;
const BASE_DELAY_MS = env.isTest ? 0 : 400;

function isRetryable(error: FetchBaseQueryError): boolean {
  if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') return true;
  return typeof error.status === 'number' && error.status >= 500;
}

/** Retries network failures and 5xx only. A 4xx or a bad payload fails fast. */
const baseQuery = retry(
  fetchBaseQuery({
    baseUrl: env.apiBaseUrl,
    timeout: 15_000,
    headers: { Accept: 'application/json' },
  }),
  {
    retryCondition: (error, _args, { attempt }) =>
      attempt <= MAX_RETRIES && isRetryable(error as FetchBaseQueryError),
    backoff: async (attempt) => {
      await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS * 2 ** attempt));
    },
  },
);

const productsApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery,
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], undefined>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBaseQuery) {
        const response = await fetchWithBaseQuery('/products');
        if (response.error) return { error: response.error };
        const parsed = parseProductList(response.data);
        if (!parsed.ok) {
          return { error: { status: 'CUSTOM_ERROR', error: parsed.reason } };
        }
        return { data: parsed.products };
      },
    }),
  }),
});

/**
 * `getCatalogPage` is the repository seam (docs/DECISIONS.md, ADR-004). FakeStore cannot filter,
 * sort or paginate, so today it reuses the cached `getProducts` result and runs the pure pipeline
 * locally. For a real catalogue, replace the queryFn with
 * `query: (q) => ({ url: '/products/search', params: q })`; hooks, components and URL state stay put.
 */
export const catalogApi = productsApi.injectEndpoints({
  endpoints: (builder) => ({
    getCatalogPage: builder.query<CatalogPage, CatalogQuery>({
      async queryFn(query, { dispatch }) {
        const subscription = dispatch(productsApi.endpoints.getProducts.initiate(undefined));
        try {
          const result = await subscription;
          if (result.error) return { error: result.error as FetchBaseQueryError };
          return { data: buildCatalogPage(result.data ?? [], query) };
        } finally {
          subscription.unsubscribe();
        }
      },
    }),
  }),
});

export const { useGetProductsQuery, useGetCatalogPageQuery } = catalogApi;
