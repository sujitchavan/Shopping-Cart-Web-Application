import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';

/**
 * The app's single RTK Query API: one reducer and one middleware, registered once in the store.
 * Features add endpoints with `baseApi.injectEndpoints(...)` and never touch the store. A new
 * resource only needs its tag type listed here. A second `createApi` is only warranted for a
 * different backend (base URL).
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  keepUnusedDataFor: 300,
  tagTypes: ['Product'],
  endpoints: () => ({}),
});
