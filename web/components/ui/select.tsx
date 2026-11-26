import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

// Heights are a prop, not a className override: cn() only joins classes, so "h-8" added after
// "h-10" would not reliably win.
const SIZES = { md: 'h-10 text-sm', sm: 'h-8 text-xs' } as const;

type SelectProps = Omit<ComponentProps<'select'>, 'size'> & { size?: keyof typeof SIZES };

// A native <select>, same look as <Input>: keyboard, screen readers and mobile pickers for free.
export function Select({ className, size = 'md', ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full rounded-md border border-border bg-background px-3',
        SIZES[size],
        'focus-visible:outline-2 focus-visible:outline-accent aria-invalid:border-danger',
        'disabled:cursor-not-allowed disabled:bg-surface',
        className,
      )}
      {...props}
    />
  );
}
