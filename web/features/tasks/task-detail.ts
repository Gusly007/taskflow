// What the task detail needs (full page and modal): the task, my projects for the Project field,
// and the view to go back to. Not a service: it uses Next's notFound(), so it lives next to the pages' needs.
import 'server-only';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api-client';
import { listProjects } from '@/features/projects/project.service';
import type { Project } from '@/features/projects/project.types';
import { parseNextParam, parseTaskIdParam, type RawSearchParams } from './search-params';
import * as taskService from './task.service';
import type { Task } from './task.types';

interface TaskDetailRouteProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}

export async function loadTaskDetail(props: TaskDetailRouteProps): Promise<{ task: Task; projects: Project[]; next: string }> {
  const taskId = parseTaskIdParam((await props.params).id);
  if (taskId === null) notFound(); // /tasks/abc

  const next = parseNextParam(await props.searchParams);
  const [task, projects] = await Promise.all([
    taskService.getTask(taskId).catch((error: unknown) => {
      // Missing, or not mine to see: the API answers 404 for both, on purpose.
      if (error instanceof ApiError && error.status === 404) notFound();
      throw error;
    }),
    listProjects(),
  ]);
  return { task, projects, next };
}

// The detail's title: what I can do with the task.
export const taskDetailTitle = (task: Task): string => (task.role === 'viewer' ? 'Task' : 'Edit task');
