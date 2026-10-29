import { http, HttpResponse, type JsonBodyType } from 'msw';
import { env } from '@/shared/config/env';
import { rawCatalog } from '../fixtures/catalog';

export const PRODUCTS_URL = `${env.apiBaseUrl}/products`;

export const handlers = [http.get(PRODUCTS_URL, () => HttpResponse.json(rawCatalog))];

/** Helpers for per-test overrides via `server.use(...)`. */
export const productsReturn = (body: JsonBodyType) =>
  http.get(PRODUCTS_URL, () => HttpResponse.json(body));

export const productsFailWith = (status: number) =>
  http.get(PRODUCTS_URL, () => new HttpResponse(null, { status }));

export const productsNetworkError = () => http.get(PRODUCTS_URL, () => HttpResponse.error());
