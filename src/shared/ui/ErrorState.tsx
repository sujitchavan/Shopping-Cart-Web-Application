import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: (() => void) | undefined;
  retryLabel?: string;
  /** Move focus to the heading when shown, so keyboard and screen-reader users land on the error. */
  focusOnMount?: boolean;
  headingLevel?: 'h1' | 'h2';
  children?: ReactNode;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
  focusOnMount = true,
  headingLevel: Heading = 'h2',
  children,
}: ErrorStateProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = useId();

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-(--radius-card) border border-line bg-surface-muted p-8 text-center"
    >
      <Heading ref={headingRef} id={headingId} tabIndex={-1} className="text-xl font-semibold">
        {title}
      </Heading>
      <p className="text-ink-muted">{message}</p>
      {onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
      {children}
    </section>
  );
}
