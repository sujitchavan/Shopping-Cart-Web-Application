/**
 * The single place where diagnostics leave the app. Users only ever see generic messages; details
 * go here. Swap the bodies for Sentry (or similar) without touching call sites.
 */
export const logger = {
  warn(message: string, details?: unknown): void {
    console.warn(`[storefront] ${message}`, ...(details === undefined ? [] : [details]));
  },
  error(message: string, details?: unknown): void {
    console.error(`[storefront] ${message}`, ...(details === undefined ? [] : [details]));
  },
};
