// Form schemas. They mirror the API's validators (taskValidator.ts) so the user gets errors
// before a round trip; the API still validates everything on its side.
import * as z from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TITLE_MAX_LENGTH } from './task.types';

// An empty optional field arrives from the form as '': treat it as "not filled in".
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: 'Enter a title.' })
    .max(TASK_TITLE_MAX_LENGTH, { error: `At most ${TASK_TITLE_MAX_LENGTH} characters.` }),
  description: optional(z.string().trim()),
  status: z.enum(TASK_STATUSES, { error: 'Pick a status.' }),
  priority: z.enum(TASK_PRIORITIES, { error: 'Pick a priority.' }),
  dueDate: optional(z.iso.date({ error: 'Enter a valid date.' })), // <input type="date"> sends "YYYY-MM-DD"
  projectId: optional(z.coerce.number().int().positive({ error: 'Pick a project.' })),
});

// The form's field names: used for error messages and to refill the form after an error.
export type CreateTaskField = keyof z.input<typeof CreateTaskSchema>;
export const CREATE_TASK_FIELDS = Object.keys(CreateTaskSchema.shape) as CreateTaskField[];
