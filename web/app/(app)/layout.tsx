import { verifySession } from '@/lib/dal';
import { AppSidebar } from '@/components/layout/app-sidebar';

// Every page in (app) needs a logged-in user. Pages and actions call verifySession() again
// themselves: a layout check alone isn't enough, because layouts don't re-render on every navigation.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await verifySession();
  return (
    <div className="flex flex-1 flex-wrap">
      <AppSidebar user={user} />
      <div className="min-w-0 flex-[999_1_560px] px-4 py-6 md:px-7">{children}</div>
    </div>
  );
}
