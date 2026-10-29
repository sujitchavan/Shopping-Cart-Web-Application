export function SkipLink({ targetId, children }: { targetId: string; children: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only z-50 rounded-lg bg-accent px-4 py-3 font-medium text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {children}
    </a>
  );
}
