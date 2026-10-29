import { createSafeStorage } from './safeStorage';

function quotaError(): DOMException {
  return new DOMException('The quota has been exceeded.', 'QuotaExceededError');
}

function fakeStorage(overrides: Partial<Storage> = {}): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    ...overrides,
  };
}

describe('createSafeStorage', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('reads and writes through to real storage', () => {
    const storage = createSafeStorage(() => window.localStorage);
    expect(storage.set('k', 'v')).toBe(true);
    expect(window.localStorage.getItem('k')).toBe('v');
    expect(storage.get('k')).toBe('v');
    storage.remove('k');
    expect(storage.get('k')).toBeNull();
    expect(storage.isPersistent()).toBe(true);
  });

  it('falls back to memory on QuotaExceededError and notifies once', () => {
    const listener = vi.fn();
    const storage = createSafeStorage(() =>
      fakeStorage({
        setItem: () => {
          throw quotaError();
        },
      }),
    );
    storage.subscribe(listener);

    expect(storage.set('cart', '1')).toBe(false);
    expect(storage.get('cart')).toBe('1');
    expect(storage.isPersistent()).toBe(false);
    expect(storage.set('cart', '2')).toBe(false);
    expect(storage.get('cart')).toBe('2');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('works when storage access itself throws (blocked cookies)', () => {
    const storage = createSafeStorage(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });
    expect(storage.isPersistent()).toBe(false);
    expect(storage.set('a', 'b')).toBe(false);
    expect(storage.get('a')).toBe('b');
    storage.remove('a');
    expect(storage.get('a')).toBeNull();
  });

  it('works when there is no storage at all', () => {
    const storage = createSafeStorage(() => undefined);
    expect(storage.isPersistent()).toBe(false);
    expect(storage.get('missing')).toBeNull();
  });

  it('falls back when getItem throws', () => {
    const storage = createSafeStorage(() =>
      fakeStorage({
        getItem: () => {
          throw new Error('boom');
        },
      }),
    );
    expect(storage.get('k')).toBeNull();
    expect(storage.isPersistent()).toBe(false);
  });

  it('falls back when removeItem throws', () => {
    const storage = createSafeStorage(() =>
      fakeStorage({
        removeItem: () => {
          throw new Error('boom');
        },
      }),
    );
    storage.remove('k');
    expect(storage.isPersistent()).toBe(false);
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const storage = createSafeStorage(() =>
      fakeStorage({
        setItem: () => {
          throw quotaError();
        },
      }),
    );
    const unsubscribe = storage.subscribe(listener);
    unsubscribe();
    storage.set('a', 'b');
    expect(listener).not.toHaveBeenCalled();
  });
});
