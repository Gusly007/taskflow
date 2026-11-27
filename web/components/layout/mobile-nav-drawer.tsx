'use client';

// The phone menu: the sidebar's content in a panel that slides in from the left.
// A native popover (popover="auto") opened and closed by buttons with popovertarget, so it works
// without JavaScript, and the browser handles a tap outside and Escape (focus back on ☰).
// The only JavaScript: close it as soon as a link inside is followed. A client-side navigation
// keeps the layout, so the open menu would otherwise stay over the new page.
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function MobileNavDrawer({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div
      id={id}
      popover="auto"
      role="dialog"
      aria-label="Menu"
      onClick={(event) => {
        if ((event.target as Element).closest('a')) event.currentTarget.hidePopover();
      }}
      className={cn(
        // Replaces the browser's popover box (centered, fit-content, border) with a full-height side panel.
        'fixed inset-y-0 left-0 right-auto m-0 h-dvh max-h-none w-[85vw] max-w-xs overflow-y-auto',
        'border-0 border-r border-solid border-border bg-surface px-3.5 py-5 text-foreground shadow-xl backdrop:bg-black/50',
        // Only shown when open: a plain "flex" would override the browser's display: none.
        'open:flex open:flex-col open:gap-6',
        // Slides in from the left (and back out), unless the user asked for less motion.
        '-translate-x-full transition-[translate,overlay,display] transition-discrete duration-200 open:translate-x-0 starting:open:-translate-x-full motion-reduce:transition-none',
      )}
    >
      {children}
    </div>
  );
}
