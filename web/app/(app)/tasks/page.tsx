import type { Metadata } from 'next';
import { listTasks } from '@/features/tasks/task.service';
import { listProjects } from '@/features/projects/project.service';
import { parseTaskSearchParams, toListTasksQuery } from '@/features/tasks/search-params';
import { describeTaskView } from '@/features/tasks/task-views';
import { QuickAdd } from '@/features/tasks/components/quick-add';
import { TaskList } from '@/features/tasks/components/task-list';

// The browser tab says which view is open: "My tasks · TaskFlow".
export async function generateMetadata(props: PageProps<'/tasks'>): Promise<Metadata> {
  return { title: describeTaskView(parseTaskSearchParams(await props.searchParams)).title };
}

// A page only reads the URL, calls services and puts components together.
// The sidebar views are URLs on this one page:
// - /tasks              all tasks: mine, the ones shared with me, and every task of my projects (GET /tasks)
// - /tasks?scope=mine   only the tasks I own (GET /tasks/mine): the API filters with my token
// - /tasks?overdue=true due date in the past and not done (both scopes)
// TODO (yours): more params in search-params.ts (?view=, filters, ?projectId=, page),
// and the Kanban view (<TaskBoard>) next to <TaskList>.
export default async function TasksPage(props: PageProps<'/tasks'>) {
  const params = parseTaskSearchParams(await props.searchParams);
  const view = describeTaskView(params);

  const [{ items: tasks, meta }, projects] = await Promise.all([
    listTasks(params.scope, toListTasksQuery(params)),
    listProjects(),
  ]);
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  return (
    <div className="flex flex-col gap-6">
      <QuickAdd />
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{view.title}</h1>
        <span className="text-sm text-muted-foreground">{meta.total} total</span>
      </div>

      <TaskList tasks={tasks} projectNames={projectNames} emptyMessage={view.emptyMessage} />
    </div>
  );
}
