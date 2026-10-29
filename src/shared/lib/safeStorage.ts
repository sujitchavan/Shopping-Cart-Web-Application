import { logger } from './logger';

/**
 * A `localStorage` wrapper that never throws. If storage is missing, blocked (Safari private mode,
 * disabled cookies) or full (`QuotaExceededError`), it degrades to an in-memory map for the rest of
 * the session and notifies subscribers once, so the UI can say "your cart won't be saved".
 */
export interface SafeStorage {
  get: (key: string) => string | null;
  /** Returns true if the value reached persistent storage. */
  set: (key: string, value: string) => boolean;
  remove: (key: string) => void;
  isPersistent: () => boolean;
  subscribe: (listener: () => void) => () => void;
}

export function createSafeStorage(getStorage: () => Storage | null | undefined): SafeStorage {
  const memory = new Map<string, string>();
  const listeners = new Set<() => void>();
  let backing: Storage | null = null;

  try {
    backing = getStorage() ?? null;
  } catch {
    backing = null;
  }
  let persistent = backing !== null;

  function fallBackToMemory(reason: unknown): void {
    if (!persistent) return;
    persistent = false;
    logger.warn('Storage unavailable; falling back to memory for this session.', reason);
    for (const listener of listeners) listener();
  }

  return {
    get(key) {
      if (persistent && backing) {
        try {
          return backing.getItem(key);
        } catch (error) {
          fallBackToMemory(error);
        }
      }
      return memory.get(key) ?? null;
    },
    set(key, value) {
      memory.set(key, value);
      if (persistent && backing) {
        try {
          backing.setItem(key, value);
          return true;
        } catch (error) {
          fallBackToMemory(error);
        }
      }
      return false;
    },
    remove(key) {
      memory.delete(key);
      if (persistent && backing) {
        try {
          backing.removeItem(key);
        } catch (error) {
          fallBackToMemory(error);
        }
      }
    },
    isPersistent: () => persistent,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const safeLocalStorage: SafeStorage = createSafeStorage(() =>
  typeof window === 'undefined' ? null : window.localStorage,
);
