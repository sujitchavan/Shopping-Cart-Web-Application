import { useEffect, useState } from 'react';
import { subscribeToAnnouncements, type Announcement } from '@/shared/lib/announce';

/**
 * Mounted once in the app shell. Both regions exist from the first render (screen readers ignore
 * regions that appear at the same time as their content). Each message is rendered in a keyed node,
 * so an identical message announced twice ("Added Jacket") is still spoken twice.
 */
export function LiveRegion() {
  const [polite, setPolite] = useState<Announcement | null>(null);
  const [assertive, setAssertive] = useState<Announcement | null>(null);

  useEffect(
    () =>
      subscribeToAnnouncements((announcement) => {
        if (announcement.politeness === 'assertive') setAssertive(announcement);
        else setPolite(announcement);
      }),
    [],
  );

  return (
    <div className="sr-only">
      <div role="status" aria-live="polite" aria-atomic="true" data-testid="live-region-polite">
        {polite && <span key={polite.id}>{polite.message}</span>}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="live-region-assertive"
      >
        {assertive && <span key={assertive.id}>{assertive.message}</span>}
      </div>
    </div>
  );
}
