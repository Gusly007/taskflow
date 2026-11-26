import Link from 'next/link';
import { buttonClassName } from './button';

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string; // the URL of another page, the rest of the query kept
}

// "‹ Previous · Page 2 of 5 · Next ›" with plain links: works without JavaScript, each page has
// its own URL. Nothing is shown when everything fits on one page.
export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  const edge = (target: number, label: string, rel: 'prev' | 'next', enabled: boolean) =>
    enabled ? (
      <Link href={hrefFor(target)} rel={rel} className={buttonClassName('secondary', 'h-9')}>
        {label}
      </Link>
    ) : (
      <span aria-disabled="true" className={buttonClassName('secondary', 'h-9 pointer-events-none opacity-40')}>
        {label}
      </span>
    );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
      {edge(page - 1, '‹ Previous', 'prev', page > 1)}
      <span className="text-sm text-muted-foreground" aria-current="page">
        Page {page} of {totalPages}
      </span>
      {edge(page + 1, 'Next ›', 'next', page < totalPages)}
    </nav>
  );
}
