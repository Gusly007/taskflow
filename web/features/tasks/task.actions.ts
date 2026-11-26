'use server';

// Server Actions for tasks: validate the arguments, call the service, refresh the page.
// A Server Action is a public endpoint (anyone can POST to it), so its arguments are checked
// even though the TypeScript types already restrict them.
import { refresh } from 'next/cache';
import * as z from 'zod';
import { ApiError } from '@/lib/api-client';
import * as taskService from './task.service';
import { TASK_STATUSES, type TaskStatus } from './task.types';

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
