import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

const VARIANTS = {
  primary: 'bg-accent text-accent-foreground hover:opacity-90',
  secondary: 'border border-border bg-background hover:bg-muted',
  ghost: 'hover:bg-muted',
  danger: 'bg-danger text-white hover:opacity-90',
} as const;

type Variant = keyof typeof VARIANTS;

// Also used on <Link>s that look like buttons ("New task"): a link that navigates stays a link.
export const buttonClassName = (variant: Variant = 'primary', className?: string): string =>
  cn(
    'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    className,
  );

type ButtonProps = ComponentProps<'button'> & { variant?: Variant };

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}
