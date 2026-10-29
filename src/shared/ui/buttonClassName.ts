import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg font-medium select-none ' +
  'transition-colors motion-reduce:transition-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-muted',
  ghost: 'text-accent hover:bg-surface-muted',
  danger: 'bg-danger text-on-danger hover:bg-danger-hover',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 text-sm',
  md: 'px-4 text-base',
  icon: 'min-w-11 px-0',
};

/** Shared by <Button> and by router <Link>s that should look like buttons. */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  className?: string | undefined;
} = {}): string {
  return clsx(base, variants[variant], sizes[size], className);
}
