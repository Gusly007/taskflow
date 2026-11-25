import { SiteHeader } from '@/components/layout/site-header';

// (auth) is a route group: it shares this layout without adding "/auth" to the URL.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6">{children}</div>
      </div>
    </>
  );
}
