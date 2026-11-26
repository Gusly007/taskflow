'use client';

// A route shown as a dialog over the current page (app/(app)/@modal). Closing it = router.back():
// the URL goes back from /tasks/new to the list, and Forward reopens it.
//
// Native <dialog> + showModal(): the browser keeps the focus inside, makes the page behind inert,
// handles Escape and gives the focus back when the dialog goes away.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export function Modal({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    // showModal() moves the focus itself (React's autoFocus already ran before it), so put it
    // back on the field the content asks for: <input data-autofocus>.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Escape: let the router close it (going back), not the browser on its own.
      onCancel={(event) => {
        event.preventDefault();
        router.back();
      }}
      // A click on the dark backdrop lands on the <dialog> itself, not on its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) router.back();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl border border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => router.back()}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
