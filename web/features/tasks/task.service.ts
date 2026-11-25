// Every call to the /tasks endpoints. One function per API route, typed in and out.
// No React or Next here (no FormData, redirect, revalidatePath): Server Actions do that.
import 'server-only';
import { apiFetch, type Page } from '@/lib/api-client';
import type { ListTasksQuery, Task, TaskScope } from './task.types';

export async function listTasks(scope: TaskScope, query: ListTasksQuery = {}): Promise<Page<Task>> {
  const { data, meta } = await apiFetch<Task[]>(scope === 'mine' ? '/tasks/mine' : '/tasks', { query: { ...query } });
  if (!meta) throw new Error('GET /tasks answered without pagination meta');
  return { items: data, meta };
}

// TODO (yours), one function per route, same pattern as listTasks:
// - getTask(id)              GET    /tasks/:id
// - createTask(input)        POST   /tasks
// - updateTask(id, input)    PUT    /tasks/:id
// - deleteTask(id)           DELETE /tasks/:id   (204: no data)
