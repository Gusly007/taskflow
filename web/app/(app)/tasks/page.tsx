import type { Metadata } from 'next';
import { listTasks } from '@/features/tasks/task.service';
import { listProjects } from '@/features/projects/project.service';
import { QuickAdd } from '@/features/tasks/components/quick-add';
import { TaskList } from '@/features/tasks/components/task-list';

export const metadata: Metadata = { title: 'Tasks' };

// A page only reads the URL, calls services and puts components together.
// "All tasks" = my tasks, the ones shared with me, and every task of my projects (GET /tasks).
// TODO (yours): read searchParams with features/tasks/search-params.ts (?scope=, ?view=, filters, ?projectId=, page),
// pass the result to listTasks(), and add the Kanban view (<TaskBoard>) next to <TaskList>.
export default async function TasksPage() {
  const [{ items: tasks, meta }, projects] = await Promise.all([listTasks('all'), listProjects()]);
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  return (
    <div className="flex flex-col gap-6">
      <QuickAdd />
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <span className="text-sm text-muted-foreground">{meta.total} total</span>
      </div>

      <TaskList tasks={tasks} projectNames={projectNames} />
    </div>
  );
}
