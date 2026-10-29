import { useId, type ReactNode, type Ref } from 'react';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
  headingRef?: Ref<HTMLHeadingElement> | undefined;
}

export function EmptyState({ title, message, action, headingRef }: EmptyStateProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-(--radius-card) border border-dashed border-line p-8 text-center"
    >
      <h2 ref={headingRef} id={headingId} tabIndex={-1} className="text-xl font-semibold">
        {title}
      </h2>
      {message && <p className="text-ink-muted">{message}</p>}
      {action}
    </section>
  );
}
