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
import { CreateTaskSchema, TASK_FORM_FIELDS, UpdateTaskSchema, type TaskFormField } from './task.schemas';
import type { TaskNoticeKind } from './search-params';
import { TASK_STATUSES, type Task, type TaskStatus } from './task.types';

export type TaskFormState = FormState<TaskFormField>;

// Everything typed so far, to refill the form if something is wrong.
const typedValues = (formData: FormData) =>
  Object.fromEntries(TASK_FORM_FIELDS.map((field) => [field, String(formData.get(field) ?? '')])) as Record<
    TaskFormField,
    string
  >;

// Back to the view the form was opened from, with ?created= / ?updated= / ?deleted= so the list can
// say what happened. replace, not push (the default in Server Actions): Back must not reopen the form.
// redirect() works by throwing, so callers keep it outside their try/catch.
// (A function declaration, not an arrow: TypeScript then knows the code after a call is unreachable.)
function backToList(formData: FormData, notice: TaskNoticeKind, taskId: number): never {
  redirect(withSearchParam(safePath(formData.get('next'), '/tasks'), notice, String(taskId)), RedirectType.replace);
}

const parseTaskId = (value: FormDataEntryValue | null): number | null => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// The "New task" form (modal or full page), through useActionState.
export async function createTask(_state: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const values = typedValues(formData);
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
  backToList(formData, 'created', task.id);
}

// The task detail form (modal or full page). Only the fields present in the form are sent:
// the project <select> is disabled, so absent, when I'm not the task owner.
export async function updateTask(_state: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const taskId = parseTaskId(formData.get('taskId'));
  if (taskId === null) return { message: 'This task no longer exists.' };

  const values = typedValues(formData);
  const sent = Object.fromEntries(TASK_FORM_FIELDS.filter((field) => formData.has(field)).map((field) => [field, values[field]]));
  const parsed = UpdateTaskSchema.safeParse(sent);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  try {
    await taskService.updateTask(taskId, parsed.data);
  } catch (error) {
    // 403 (viewer, or moving a task I don't own), 404 (deleted meanwhile): shown above the buttons.
    if (error instanceof ApiError) return { message: error.message, values };
    throw error;
  }
  backToList(formData, 'updated', taskId);
}

// "Delete" in the task detail, after the confirmation step. Task owner only (the API checks).
export async function deleteTask(_state: FormState<never>, formData: FormData): Promise<FormState<never>> {
  const taskId = parseTaskId(formData.get('taskId'));
  if (taskId === null) return { message: 'This task no longer exists.' };

  try {
    await taskService.deleteTask(taskId);
  } catch (error) {
    if (error instanceof ApiError) return { message: error.message };
    throw error;
  }
  backToList(formData, 'deleted', taskId);
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
