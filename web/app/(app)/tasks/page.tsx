import type { Metadata } from 'next';
import { listTasks } from '@/features/tasks/task.service';
import { QuickAdd } from '@/features/tasks/components/quick-add';

export const metadata: Metadata = { title: 'Tasks' };

// A page only reads the URL, calls a service and puts components together.
// TODO (yours): read searchParams with features/tasks/search-params.ts (?scope=, ?view=, filters, page),
// pass the result to listTasks(), and render <TaskList> or <TaskBoard> from features/tasks/components/.
export default async function TasksPage() {
  const { items: tasks, meta } = await listTasks('all');

  return (
    <div className="flex flex-col gap-6">
      <QuickAdd />
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <span className="text-sm text-muted-foreground">{meta.total} total</span>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No tasks yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between px-4 py-3">
              <span>{task.title}</span>
              <span className="text-sm text-muted-foreground">{task.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
