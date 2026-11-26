import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

// A native <select>, same look as <Input>: keyboard, screen readers and mobile pickers for free.
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-md border border-border bg-background px-3 text-sm',
        'focus-visible:outline-2 focus-visible:outline-accent aria-invalid:border-danger',
        'disabled:cursor-not-allowed disabled:bg-surface',
        className,
      )}
      {...props}
    />
  );
}
