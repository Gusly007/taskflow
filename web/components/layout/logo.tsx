import Link from 'next/link';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <path d="M4 6h10M4 12h16M4 18h7" />
      </svg>
      TaskFlow
    </Link>
  );
}
