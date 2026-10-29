import { safeLocalStorage, type SafeStorage } from '@/shared/lib/safeStorage';
import { Banner } from '@/shared/ui';
import { useCartIsPersistent } from '../../hooks/useCart';

/** One-time, non-blocking notice shown when the cart can only live in memory. */
export function StorageNotice({ storage = safeLocalStorage }: { storage?: SafeStorage }) {
  const persistent = useCartIsPersistent(storage);
  if (persistent) return null;
  return (
    <Banner>
      Your cart won&apos;t be saved on this device. Your browser is blocking storage (private
      browsing or full storage), so items will be lost when you close this tab.
    </Banner>
  );
}
