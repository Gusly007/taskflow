import Link from 'next/link';
import { SiteHeader } from '@/components/layout/site-header';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <section className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your tasks, shared with the right people.</h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          TaskFlow keeps your tasks organized by status, priority and due date, and lets you invite collaborators as
          viewers or editors.
        </p>
        <div className="flex gap-3">
          <Link
            href="/register"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:opacity-90"
          >
            Get started
          </Link>
          <Link href="/login" className="rounded-md border border-border px-5 py-2.5 font-medium hover:bg-muted">
            Sign in
          </Link>
        </div>
      </section>
    </>
  );
}
