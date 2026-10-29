/**
 * A tiny pub/sub for screen-reader announcements. Any module can call `announce()`; the single
 * `<LiveRegion>` mounted in the app shell renders the message into an aria-live region.
 */
export type Politeness = 'polite' | 'assertive';

export interface Announcement {
  readonly id: number;
  readonly message: string;
  readonly politeness: Politeness;
}

type Listener = (announcement: Announcement) => void;

const listeners = new Set<Listener>();
let sequence = 0;

export function announce(message: string, politeness: Politeness = 'polite'): void {
  const trimmed = message.trim();
  if (trimmed === '') return;
  sequence += 1;
  const announcement: Announcement = { id: sequence, message: trimmed, politeness };
  for (const listener of listeners) listener(announcement);
}

export function subscribeToAnnouncements(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
