import type { ReactNode } from 'react';
import { verifySession } from '@/lib/dal';
import { AppSidebar } from '@/components/layout/app-sidebar';

// Every page in (app) needs a logged-in user. Pages and actions call verifySession() again
// themselves: a layout check alone isn't enough, because layouts don't re-render on every navigation.
// `modal` is the @modal slot: a route shown as a dialog over the page (e.g. "New task").
//
// Phone: the sidebar is above the content. From md: side by side, and only the content scrolls
// (the sidebar is sticky, see app-sidebar.tsx).
export default async function AppLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  const { user } = await verifySession();
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AppSidebar user={user} />
      <div className="min-w-0 flex-1 px-4 py-6 md:px-7">{children}</div>
      {modal}
    </div>
  );
}
