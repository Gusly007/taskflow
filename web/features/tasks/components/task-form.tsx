'use client';

// The task form, in three modes:
// - creating ("New task"): empty, Backlog / Medium by default;
// - editing (task detail, I'm owner or editor): filled with the task, "Save changes";
// - reading (task detail, I'm a viewer): the same fields, disabled, and a Close button.
// The same component in the modal (opened from the list) and on the full page (direct link,
// refresh): only Cancel / Close differs.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useRef } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClassName } from '@/components/ui/button';
import { FormField, SelectField, TextareaField } from '@/components/ui/form-field';
import type { Project } from '@/features/projects/project.types';
import { createTask, updateTask } from '../task.actions';
import { PRIORITY_LABELS, STATUS_LABELS } from '../task-labels';
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TITLE_MAX_LENGTH, type Task } from '../task.types';

interface TaskFormProps {
  projects: Project[]; // all my projects; the ones I can't add tasks to are left out below
  next: string; // the view to go back to after saving or cancelling
  task?: Task; // the task to edit (or read, for a viewer); absent = creating a new one
  inModal?: boolean; // Cancel = close the modal (router.back) instead of a link to `next`
}

export function TaskForm({ projects, next, task, inModal = false }: TaskFormProps) {
  const editing = task !== undefined;
  // What I may do comes from the API (task.role): the form only reflects it, the API still checks.
  const readOnly = task?.role === 'viewer';
  const canMove = !editing || task.role === 'owner'; // only the task owner can change its project

  // state = what the action returned last time (errors + values typed); pending = while it runs.
  const [state, action, pending] = useActionState(editing ? updateTask : createTask, undefined);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state?.fieldErrors;

  // After a validation error, put the focus on the first field to fix.
  useEffect(() => {
    if (state?.fieldErrors) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  // What the fields show: what was typed (after an error), else the task, else the defaults.
  const typed = state?.values;
  const initial = {
    title: typed?.title ?? task?.title ?? '',
    description: typed?.description ?? task?.description ?? '',
    status: typed?.status ?? task?.status ?? 'backlog', // a new task starts at the beginning of the workflow
    priority: typed?.priority ?? task?.priority ?? 'medium',
    dueDate: typed?.dueDate ?? task?.dueDate ?? '',
    projectId: typed?.projectId ?? (task?.projectId ? String(task.projectId) : ''),
  };

  // Projects offered: the ones where I can add tasks, by name (the API checks it anyway). When
  // editing, the task's current project is always listed, even if I can't add tasks to it, or
  // don't even know its name (I see the task as a collaborator, not as a project member).
  const options = projects
    .filter((project) => project.role !== 'viewer')
    .map((project) => ({ id: project.id, name: project.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (task?.projectId && !options.some((option) => option.id === task.projectId)) {
    const name = projects.find((project) => project.id === task.projectId)?.name ?? 'Current project';
    options.unshift({ id: task.projectId, name });
  }

  const close = inModal ? (
    <Button type="button" variant="secondary" onClick={() => router.back()}>
      {readOnly ? 'Close' : 'Cancel'}
    </Button>
  ) : (
    <Link href={next} className={buttonClassName('secondary')}>
      {readOnly ? 'Close' : 'Cancel'}
    </Link>
  );

  return (
    <form
      ref={formRef}
      // Without JavaScript, the browser posts the form to the action (values come back in `state`).
      action={action}
      // With JavaScript, we call the action ourselves: React resets a <form action={...}> after each
      // submit, which puts every <select> back on its first option when the server answers an error.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      noValidate
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="next" value={next} />
      {task && <input type="hidden" name="taskId" value={task.id} />}

      {readOnly && <Alert tone="info">You can view this task, but not change it.</Alert>}

      {/* disabled on a fieldset disables every field inside it (a viewer reads, doesn't edit). */}
      <fieldset disabled={readOnly} className="flex min-w-0 flex-col gap-4">
        <FormField
          name="title"
          label="Title"
          required
          autoFocus={!readOnly} // on the full page
          data-autofocus={readOnly ? undefined : true} // in the modal (see components/ui/modal.tsx)
          maxLength={TASK_TITLE_MAX_LENGTH}
          defaultValue={initial.title}
          errors={errors?.title}
        />
        <TextareaField name="description" label="Description" rows={4} defaultValue={initial.description} errors={errors?.description} />

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField name="status" label="Status" defaultValue={initial.status} errors={errors?.status}>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </SelectField>
          <SelectField name="priority" label="Priority" defaultValue={initial.priority} errors={errors?.priority}>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </SelectField>
          <FormField name="dueDate" label="Due date" type="date" defaultValue={initial.dueDate} errors={errors?.dueDate} />
          <SelectField
            name="projectId"
            label="Project"
            // A disabled field isn't sent with the form: the action then leaves the project alone.
            disabled={!canMove}
            hint={!canMove && !readOnly ? 'Only the creator of the task can move it to another project.' : undefined}
            defaultValue={initial.projectId}
            errors={errors?.projectId}
          >
            <option value="">No project (personal)</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </SelectField>
        </div>
      </fieldset>

      {state?.message && <Alert>{state.message}</Alert>}

      <div className="flex justify-end gap-2 pt-1">
        {close}
        {!readOnly && (
          <Button type="submit" disabled={pending}>
            {editing ? (pending ? 'Saving…' : 'Save changes') : pending ? 'Creating…' : 'Create task'}
          </Button>
        )}
      </div>
    </form>
  );
}
