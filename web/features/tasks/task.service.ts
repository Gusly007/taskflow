// Every call to the /tasks endpoints. One function per API route, typed in and out.
// No React or Next here (no FormData, redirect, revalidatePath): Server Actions do that.
import 'server-only';
import { apiFetch, type Page } from '@/lib/api-client';
import type { CreateTaskInput, ListTasksQuery, Task, TaskScope, UpdateTaskInput } from './task.types';

export async function listTasks(scope: TaskScope, query: ListTasksQuery = {}): Promise<Page<Task>> {
  const { data, meta } = await apiFetch<Task[]>(scope === 'mine' ? '/tasks/mine' : '/tasks', { query: { ...query } });
  if (!meta) throw new Error('GET /tasks answered without pagination meta');
  return { items: data, meta };
}

// GET /tasks/:id: 404 (ApiError) if it doesn't exist or I can't see it (the API doesn't tell which).
export async function getTask(id: number): Promise<Task> {
  const { data } = await apiFetch<Task>(`/tasks/${id}`);
  return data;
}

// POST /tasks: I become the owner. 403 / 404 if projectId is a project I can't add tasks to.
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await apiFetch<Task>('/tasks', { method: 'POST', body: input });
  return data;
}

// PUT /tasks/:id is a partial update: { status: 'done' } changes the status and nothing else.
// 403 if I'm only a viewer of the task, 404 if I can't see it (ApiError, handled by the action).
export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  const { data } = await apiFetch<Task>(`/tasks/${id}`, { method: 'PUT', body: input });
  return data;
}

// DELETE /tasks/:id: 204, no data. Task owner only (403 otherwise).
export async function deleteTask(id: number): Promise<void> {
  await apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' });
}
