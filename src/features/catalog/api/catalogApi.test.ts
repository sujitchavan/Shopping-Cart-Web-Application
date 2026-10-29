import { http, HttpResponse } from 'msw';
import { createTestStore } from '@/test/renderWithProviders';
import { server } from '@/test/msw/server';
import {
  PRODUCTS_URL,
  productsFailWith,
  productsNetworkError,
  productsReturn,
} from '@/test/msw/handlers';
import { catalogApi } from './catalogApi';

async function fetchProducts() {
  const store = createTestStore();
  const result = await store.dispatch(catalogApi.endpoints.getProducts.initiate(undefined));
  return result;
}

describe('catalogApi.getProducts', () => {
  it('returns parsed products with prices in integer cents', async () => {
    const result = await fetchProducts();
    expect(result.data).toHaveLength(14);
    expect(result.data?.find((p) => p.id === 10)?.priceCents).toBe(1999);
  });

  it('returns an empty list for []', async () => {
    server.use(productsReturn([]));
    const result = await fetchProducts();
    expect(result.data).toEqual([]);
  });

  it('treats a non-array payload as an error without retrying', async () => {
    let calls = 0;
    server.use(
      http.get(PRODUCTS_URL, () => {
        calls += 1;
        return HttpResponse.json({ products: [] });
      }),
    );
    const result = await fetchProducts();
    expect(result.isError).toBe(true);
    expect(result.error).toMatchObject({ status: 'CUSTOM_ERROR' });
    expect(calls).toBe(1);
  });

  it('retries a 5xx twice before failing', async () => {
    let calls = 0;
    server.use(
      http.get(PRODUCTS_URL, () => {
        calls += 1;
        return new HttpResponse(null, { status: 503 });
      }),
    );
    const result = await fetchProducts();
    expect(result.error).toMatchObject({ status: 503 });
    expect(calls).toBe(3);
  });

  it('recovers when a retry succeeds', async () => {
    let calls = 0;
    server.use(
      http.get(PRODUCTS_URL, () => {
        calls += 1;
        return calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([]);
      }),
    );
    const result = await fetchProducts();
    expect(result.data).toEqual([]);
    expect(calls).toBe(2);
  });

  it('does not retry a 404', async () => {
    let calls = 0;
    server.use(
      http.get(PRODUCTS_URL, () => {
        calls += 1;
        return new HttpResponse(null, { status: 404 });
      }),
    );
    const result = await fetchProducts();
    expect(result.error).toMatchObject({ status: 404 });
    expect(calls).toBe(1);
  });

  it('reports a network failure as an error result (no unhandled rejection)', async () => {
    server.use(productsNetworkError());
    const result = await fetchProducts();
    expect(result.error).toMatchObject({ status: 'FETCH_ERROR' });
  });
});

describe('catalogApi.getCatalogPage', () => {
  it('filters, sorts and paginates on top of the cached product list', async () => {
    const store = createTestStore();
    const result = await store.dispatch(
      catalogApi.endpoints.getCatalogPage.initiate({
        category: 'electronics',
        q: 'ssd',
        sort: 'price-asc',
        page: 1,
        pageSize: 12,
      }),
    );
    expect(result.data?.items.map((p) => p.id)).toEqual([10, 9]);
    expect(result.data?.total).toBe(2);
    expect(result.data?.categories).toContain('electronics');
  });

  it('propagates a product-list failure', async () => {
    server.use(productsFailWith(404));
    const store = createTestStore();
    const result = await store.dispatch(
      catalogApi.endpoints.getCatalogPage.initiate({
        category: null,
        q: '',
        sort: 'name-asc',
        page: 1,
        pageSize: 12,
      }),
    );
    expect(result.error).toMatchObject({ status: 404 });
  });
});
