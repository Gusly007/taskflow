import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { newTaskHref, parseTaskSearchParams, tasksHref } from '@/features/tasks/search-params';
import { loadTasksPage } from '@/features/tasks/task-list-page';
import { describeTaskView } from '@/features/tasks/task-views';
import { QuickAdd } from '@/features/tasks/components/quick-add';
import { TaskFilters } from '@/features/tasks/components/task-filters';
import { TaskList } from '@/features/tasks/components/task-list';
import { TaskNotice } from '@/features/tasks/components/task-notice';

// The browser tab says which view is open: "My tasks · TaskFlow".
export async function generateMetadata(props: PageProps<'/tasks'>): Promise<Metadata> {
  return { title: describeTaskView(parseTaskSearchParams(await props.searchParams)).title };
}

// A page only reads the URL, calls services and puts components together. Everything is in the URL
// (README rule 6), and the API does the filtering, sorting and paging:
// - the sidebar views: /tasks (all), ?scope=mine (only mine), ?overdue=true
// - the filter bar:    ?status=todo&status=done, ?priority=high, ?projectId=3, ?sort=dueDate
// - the pagination:    ?page=2
// TODO (yours): the Kanban view (<TaskBoard>, ?view=board) next to <TaskList>.
export default async function TasksPage(props: PageProps<'/tasks'>) {
  const params = parseTaskSearchParams(await props.searchParams);
  const view = describeTaskView(params);
  // This exact view (filters and page included): the task forms come back to it after saving.
  const viewHref = tasksHref(params);

  const {
    page: { items: tasks, meta },
    projects,
  } = await loadTasksPage(params);
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  return (
    <div className="flex flex-col gap-6">
      <QuickAdd />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{view.title}</h1>
          <span className="text-sm text-muted-foreground">{meta.total} total</span>
        </div>
        {/* Opens the form in a modal over this list (app/(app)/@modal), then comes back to this view. */}
        <Link href={newTaskHref(viewHref)} className={buttonClassName('primary', 'h-9')}>
          New task
        </Link>
      </div>

      <TaskFilters params={params} projects={projects.map(({ id, name }) => ({ id, name }))} />

      {params.notice && (
        // key: a second notice in a row (another task created...) shows again, even if the first was dismissed.
        <TaskNotice
          key={`${params.notice.kind}-${params.notice.taskId}`}
          kind={params.notice.kind}
          visibleInView={tasks.some((task) => task.id === params.notice?.taskId)}
        />
      )}

      <TaskList tasks={tasks} projectNames={projectNames} view={viewHref} emptyMessage={view.emptyMessage} />

      <Pagination page={meta.page} totalPages={meta.totalPages} hrefFor={(page) => tasksHref({ ...params, page })} />
    </div>
  );
}
