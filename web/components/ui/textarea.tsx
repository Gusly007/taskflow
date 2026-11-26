import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

// Same look as <Input>, several lines high.
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm',
        'placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-accent',
        'aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-surface',
        className,
      )}
      {...props}
    />
  );
}
