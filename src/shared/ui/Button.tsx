import type { ComponentProps } from 'react';
import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonClassName';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** Defaults to type="button"; callers opt into "submit". */
export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClassName({ variant, size, className })} {...rest} />;
}
