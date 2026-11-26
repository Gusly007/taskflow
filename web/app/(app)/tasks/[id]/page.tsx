import type { Metadata } from 'next';
import { loadTaskDetail, taskDetailTitle } from '@/features/tasks/task-detail';
import { TaskDetail } from '@/features/tasks/components/task-detail';

export const metadata: Metadata = { title: 'Task' };

// The full page, for a direct link or a refresh on /tasks/12. Clicking a task in the list shows
// the same detail in a modal instead: see app/(app)/@modal/(.)tasks/[id]/page.tsx.
// (/tasks/new is not caught here: a static segment wins over [id].)
export default async function TaskPage(props: PageProps<'/tasks/[id]'>) {
  const { task, projects, next } = await loadTaskDetail(props);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{taskDetailTitle(task)}</h1>
      <TaskDetail task={task} projects={projects} next={next} />
    </div>
  );
}
