import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a stable function that calls the latest `callback` after `delayMs` of inactivity, plus
 * `flush` (run now) and `cancel`. Pending calls are cancelled on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): { run: (...args: Args) => void; flush: () => void; cancel: () => void } {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingArgsRef = useRef<Args | undefined>(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = undefined;
    pendingArgsRef.current = undefined;
  }, []);

  const flush = useCallback(() => {
    const args = pendingArgsRef.current;
    cancel();
    if (args) callbackRef.current(...args);
  }, [cancel]);

  const run = useCallback(
    (...args: Args) => {
      clearTimeout(timerRef.current);
      pendingArgsRef.current = args;
      timerRef.current = setTimeout(flush, delayMs);
    },
    [delayMs, flush],
  );

  useEffect(() => cancel, [cancel]);

  return { run, flush, cancel };
}
