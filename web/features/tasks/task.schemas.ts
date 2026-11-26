// Form schemas. They mirror the API's validators (taskValidator.ts) so the user gets errors
// before a round trip; the API still validates everything on its side.
import * as z from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TITLE_MAX_LENGTH } from './task.types';

const title = z
  .string()
  .trim()
  .min(1, { error: 'Enter a title.' })
  .max(TASK_TITLE_MAX_LENGTH, { error: `At most ${TASK_TITLE_MAX_LENGTH} characters.` });
const status = z.enum(TASK_STATUSES, { error: 'Pick a status.' });
const priority = z.enum(TASK_PRIORITIES, { error: 'Pick a priority.' });
const dueDate = z.iso.date({ error: 'Enter a valid date.' }); // <input type="date"> sends "YYYY-MM-DD"
const projectId = z.coerce.number().int().positive({ error: 'Pick a project.' });

// Creating: an empty optional field means "not filled in" -> left out, the API applies its default.
const notFilledIn = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const CreateTaskSchema = z.object({
  title,
  description: notFilledIn(z.string().trim()),
  status,
  priority,
  dueDate: notFilledIn(dueDate),
  projectId: notFilledIn(projectId),
});

// Editing: an empty field means "cleared" -> null, which the API reads as "remove the due date" /
// "take the task out of its project". A field missing from the form (e.g. the project <select>,
// disabled when I'm not the task owner) stays undefined: it isn't sent, so it doesn't change.
const clearable = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? null : value), schema.nullable().optional());

export const UpdateTaskSchema = z.object({
  title: title.optional(),
  description: z.string().trim().optional(), // '' empties it
  status: status.optional(),
  priority: priority.optional(),
  dueDate: clearable(dueDate),
  projectId: clearable(projectId),
});

// The form's field names (the same for both forms): error messages and refilling after an error.
export type TaskFormField = keyof z.input<typeof CreateTaskSchema>;
export const TASK_FORM_FIELDS = Object.keys(CreateTaskSchema.shape) as TaskFormField[];
