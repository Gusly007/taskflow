'use client';

// Shown when a page throws (API down, unexpected error). Error boundaries must be Client Components.
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void; // re-fetches and re-renders the page from the server
}) {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        {/* Server errors only reach the browser as a digest (no message), so details never leak. */}
        {error.digest ? 'The server could not complete the request. Try again in a moment.' : error.message}
      </p>
      <Button variant="secondary" onClick={() => unstable_retry()}>
        Try again
      </Button>
    </div>
  );
}
