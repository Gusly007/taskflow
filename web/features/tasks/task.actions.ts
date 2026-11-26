'use server';

// Server Actions for tasks: validate the arguments, call the service, refresh the page.
// A Server Action is a public endpoint (anyone can POST to it), so its arguments are checked
// even though the TypeScript types already restrict them.
import { refresh } from 'next/cache';
import { redirect, RedirectType } from 'next/navigation';
import * as z from 'zod';
import { ApiError } from '@/lib/api-client';
import type { FormState } from '@/lib/form-state';
import { safePath, withSearchParam } from '@/lib/paths';
import * as taskService from './task.service';
import { CREATE_TASK_FIELDS, CreateTaskSchema, type CreateTaskField } from './task.schemas';
import { TASK_STATUSES, type Task, type TaskStatus } from './task.types';

export type CreateTaskState = FormState<CreateTaskField>;

// The "New task" form (modal or full page), through useActionState.
export async function createTask(_state: CreateTaskState, formData: FormData): Promise<CreateTaskState> {
  // Everything typed so far, to refill the form if something is wrong.
  const values = Object.fromEntries(
    CREATE_TASK_FIELDS.map((field) => [field, String(formData.get(field) ?? '')]),
  ) as Record<CreateTaskField, string>;

  const parsed = CreateTaskSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  let task: Task;
  try {
    task = await taskService.createTask(parsed.data);
  } catch (error) {
    // 400 (API validation), 403 / 404 (project I can't add tasks to): shown above the buttons.
    if (error instanceof ApiError) return { message: error.message, values };
    throw error; // unexpected (API down...): handled by app/error.tsx
  }

  // Back to the view the form was opened from, with ?created= so the list can say "Task created".
  // replace, not push (the default in Server Actions): Back must not reopen the form.
  // redirect() works by throwing, so it stays outside the try/catch.
  const next = safePath(formData.get('next'), '/tasks');
  redirect(withSearchParam(next, 'created', String(task.id)), RedirectType.replace);
}

const UpdateStatusSchema = z.object({
  taskId: z.number().int().positive(),
  status: z.enum(TASK_STATUSES),
});

// undefined = it worked. Otherwise a message to show next to the control.
export type ActionResult = { message: string } | undefined;

// Called directly by <TaskStatusMenu> (no form): updateTaskStatus(3, 'in-review').
export async function updateTaskStatus(taskId: number, status: TaskStatus): Promise<ActionResult> {
  const parsed = UpdateStatusSchema.safeParse({ taskId, status });
  if (!parsed.success) return { message: 'Invalid status.' };

  try {
    await taskService.updateTask(parsed.data.taskId, { status: parsed.data.status });
  } catch (error) {
    // 403 (viewer), 404 (task deleted meanwhile)...: the API's message is shown to the user.
    if (error instanceof ApiError) return { message: error.message };
    throw error; // unexpected (API down...): handled by app/error.tsx
  }

  // The API is called with cache: 'no-store', so there is no Next cache to revalidate:
  // refresh() re-renders the current page (whichever page the menu is on) with fresh data.
  refresh();
}
