// What the tasks page needs: one page of tasks (filtered, sorted and paginated by the API) and my
// projects (labels and the Project filter). The API calls stay in the services (README rule 1);
// this only adds what a page needs on top: Next's redirect() for URLs that can't be shown as is.
import 'server-only';
import { redirect } from 'next/navigation';
import { ApiError, type Page } from '@/lib/api-client';
import { listProjects } from '@/features/projects/project.service';
import type { Project } from '@/features/projects/project.types';
import { tasksHref, toListTasksQuery, type TaskSearchParams } from './search-params';
import * as taskService from './task.service';
import type { Task } from './task.types';

export async function loadTasksPage(params: TaskSearchParams): Promise<{ page: Page<Task>; projects: Project[] }> {
  const [page, projects] = await Promise.all([
    taskService.listTasks(params.scope, toListTasksQuery(params)).catch((error: unknown) => {
      // ?projectId= of a project I'm not in (old link, removed from it...): the API answers 404.
      // Show the same view without that filter rather than an error page.
      if (error instanceof ApiError && error.status === 404 && params.projectId !== null) {
        redirect(tasksHref({ ...params, projectId: null, page: 1 }));
      }
      throw error;
    }),
    listProjects(),
  ]);

  // ?page=9 when there are only 3 pages (bookmark, tasks deleted meanwhile...): go to the last one.
  const { totalPages } = page.meta;
  if (page.items.length === 0 && params.page > 1 && totalPages >= 1) {
    redirect(tasksHref({ ...params, page: totalPages }));
  }

  return { page, projects };
}
