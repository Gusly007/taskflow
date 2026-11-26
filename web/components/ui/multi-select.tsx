'use client';

// A drop-down list where several options can be checked ("Status: To do, In progress ▾").
// Built on <details>/<summary> with real checkboxes inside:
// - it opens and closes without JavaScript, and the checkboxes are sent with their form;
// - screen readers announce the summary as an expandable button, then a group of checkboxes;
// - with JavaScript, Escape closes it (focus back on the button), so does a click outside.
// It stays open while options are checked, to pick several in a row.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface MultiSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface MultiSelectProps {
  name: string; // the form field: ?name=a&name=b
  label: string; // "Status", shown above the button
  allLabel: string; // what nothing checked means: "All statuses"
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void; // the new selection, in the options' order
  className?: string;
}

// "All statuses", "To do", "To do, In progress", "3 selected".
const summarize = (options: MultiSelectOption[], selected: string[], allLabel: string): string => {
  const labels = options.filter((option) => selected.includes(option.value)).map((option) => option.label);
  if (labels.length === 0) return allLabel;
  return labels.length <= 2 ? labels.join(', ') : `${labels.length} selected`;
};

export function MultiSelect({ name, label, allLabel, options, selected, onChange, className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const labelId = useId();

  // A click anywhere outside closes it.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const toggle = (value: string) => {
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    onChange(options.map((option) => option.value).filter((v) => next.includes(v)));
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span id={labelId} className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <details
        ref={detailsRef}
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.preventDefault();
            setOpen(false);
            summaryRef.current?.focus();
          }
        }}
        className="relative"
      >
        <summary
          ref={summaryRef}
          aria-labelledby={`${labelId} ${labelId}-value`}
          className={cn(
            'flex h-8 w-full cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-xs',
            '[&::-webkit-details-marker]:hidden hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent',
          )}
        >
          <span id={`${labelId}-value`} className={cn('truncate', selected.length > 0 && 'font-medium')}>
            {summarize(options, selected, allLabel)}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted-foreground">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </summary>
        <div
          role="group"
          aria-labelledby={labelId}
          className="absolute left-0 top-full z-20 mt-1 flex min-w-full flex-col rounded-lg border border-border bg-background p-1 shadow-lg"
        >
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-sm hover:bg-muted has-[:focus-visible]:bg-muted"
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={selected.includes(option.value)}
                onChange={() => toggle(option.value)}
                className="size-4 accent-[var(--accent)]"
              />
              {option.icon}
              {option.label}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
