import type { Metadata } from 'next';
import { listProjects } from '@/features/projects/project.service';
import { parseNextParam } from '@/features/tasks/search-params';
import { TaskForm } from '@/features/tasks/components/task-form';

export const metadata: Metadata = { title: 'New task' };

// The full page, for a direct link or a refresh on /tasks/new. Clicking "New task" in the list
// shows the same form in a modal instead: see app/(app)/@modal/(.)tasks/new/page.tsx.
export default async function NewTaskPage(props: PageProps<'/tasks/new'>) {
  const next = parseNextParam(await props.searchParams);
  const projects = await listProjects();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">New task</h1>
      <TaskForm projects={projects} next={next} />
    </div>
  );
}
