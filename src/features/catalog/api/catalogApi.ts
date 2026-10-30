import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { baseApi } from '@/shared/api';
import { buildCatalogPage } from '../model/filterSort';
import type { CatalogPage, CatalogQuery } from '../model/types';
import { parseProductList, type Product } from './productSchema';

const productsApi = baseApi.injectEndpoints({
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
      providesTags: ['Product'],
    }),
  }),
});

/**
 * `getCatalogPage` is the repository seam. FakeStore cannot filter, sort or paginate, so today it
 * reuses the cached `getProducts` result and runs the pure pipeline locally. For a real catalogue,
 * replace the queryFn with `query: (q) => ({ url: '/products/search', params: q })`; hooks,
 * components and URL state stay put.
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
      providesTags: ['Product'],
    }),
  }),
});

export const { useGetProductsQuery, useGetCatalogPageQuery } = catalogApi;
