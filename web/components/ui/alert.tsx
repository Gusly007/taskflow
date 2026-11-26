import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'info'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        tone === 'error'
          ? 'border-danger/40 bg-danger/10 text-danger'
          : 'border-border bg-muted',
      )}
    >
      {children}
    </p>
  );
}
