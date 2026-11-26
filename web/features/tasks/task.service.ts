// Every call to the /tasks endpoints. One function per API route, typed in and out.
// No React or Next here (no FormData, redirect, revalidatePath): Server Actions do that.
import 'server-only';
import { apiFetch, type Page } from '@/lib/api-client';
import type { ListTasksQuery, Task, TaskScope, UpdateTaskInput } from './task.types';

export async function listTasks(scope: TaskScope, query: ListTasksQuery = {}): Promise<Page<Task>> {
  const { data, meta } = await apiFetch<Task[]>(scope === 'mine' ? '/tasks/mine' : '/tasks', { query: { ...query } });
  if (!meta) throw new Error('GET /tasks answered without pagination meta');
  return { items: data, meta };
}

// PUT /tasks/:id is a partial update: { status: 'done' } changes the status and nothing else.
// 403 if I'm only a viewer of the task, 404 if I can't see it (ApiError, handled by the action).
export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  const { data } = await apiFetch<Task>(`/tasks/${id}`, { method: 'PUT', body: input });
  return data;
}

// TODO (yours), one function per route, same pattern as listTasks:
// - getTask(id)              GET    /tasks/:id
// - createTask(input)        POST   /tasks
// - deleteTask(id)           DELETE /tasks/:id   (204: no data)
