import placeholderUrl from '@/assets/placeholder.svg';

// Imported (not in public/) so the build emits it as a content-hashed, long-cacheable asset.
export const PLACEHOLDER_IMAGE = placeholderUrl;

const MAX_URL_LENGTH = 2048;

export const DEFAULT_IMAGE_HOSTS: ReadonlySet<string> = new Set(['fakestoreapi.com']);

/**
 * Returns `raw` only if it is an https URL on an allow-listed host with no credentials; anything
 * else (javascript:, data:, http:, unknown hosts, junk) becomes the local placeholder image.
 */
export function safeImageUrl(
  raw: unknown,
  allowedHosts: ReadonlySet<string> = DEFAULT_IMAGE_HOSTS,
): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_URL_LENGTH) {
    return PLACEHOLDER_IMAGE;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return PLACEHOLDER_IMAGE;
  }
  if (url.protocol !== 'https:' || url.username !== '' || url.password !== '') {
    return PLACEHOLDER_IMAGE;
  }
  return allowedHosts.has(url.hostname) ? url.href : PLACEHOLDER_IMAGE;
}
