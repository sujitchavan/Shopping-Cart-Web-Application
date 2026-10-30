import { fetchBaseQuery, retry, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { env } from '@/shared/config/env';

const MAX_RETRIES = 2;
const BASE_DELAY_MS = env.isTest ? 0 : 400;

function isRetryable(error: FetchBaseQueryError): boolean {
  if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') return true;
  return typeof error.status === 'number' && error.status >= 500;
}

/** Retries network failures and 5xx only. A 4xx or a bad payload fails fast. */
export const baseQuery = retry(
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
