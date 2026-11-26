import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-border bg-background px-3 text-sm',
        'placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-accent',
        'aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  );
}
