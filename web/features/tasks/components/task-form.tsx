'use client';

// The "New task" form. The same component in the modal (opened from the list) and on the full
// /tasks/new page (direct link, refresh): only the Cancel button differs.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useActionState, useEffect, useRef } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClassName } from '@/components/ui/button';
import { FormField, SelectField, TextareaField } from '@/components/ui/form-field';
import type { Project } from '@/features/projects/project.types';
import { createTask } from '../task.actions';
import { PRIORITY_LABELS, STATUS_LABELS } from '../task-labels';
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TITLE_MAX_LENGTH } from '../task.types';

interface TaskFormProps {
  projects: Project[]; // all my projects; the ones I can't add tasks to are left out below
  next: string; // the view to go back to after saving or cancelling
  inModal?: boolean; // Cancel = close the modal (router.back) instead of a link to `next`
}

export function TaskForm({ projects, next, inModal = false }: TaskFormProps) {
  // state = what the action returned last time (errors + values typed); pending = while it runs.
  const [state, action, pending] = useActionState(createTask, undefined);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const values = state?.values;
  const errors = state?.fieldErrors;

  // After a validation error, put the focus on the first field to fix.
  useEffect(() => {
    if (state?.fieldErrors) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  // Only the projects where I can add tasks, by name. Just to keep the list short: the API checks it
  // anyway (README rule 7) and answers 403 if the role changed meanwhile.
  const writableProjects = projects
    .filter((project) => project.role !== 'viewer')
    .sort((a, b) => a.name.localeCompare(b.name));

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

      <FormField
        name="title"
        label="Title"
        required
        autoFocus // on the full page
        data-autofocus // in the modal (see components/ui/modal.tsx)
        maxLength={TASK_TITLE_MAX_LENGTH}
        defaultValue={values?.title}
        errors={errors?.title}
      />
      <TextareaField
        name="description"
        label="Description"
        rows={4}
        defaultValue={values?.description}
        errors={errors?.description}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* A new task starts at the beginning of the workflow, unless another status is picked. */}
        <SelectField name="status" label="Status" defaultValue={values?.status ?? 'backlog'} errors={errors?.status}>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </SelectField>
        <SelectField name="priority" label="Priority" defaultValue={values?.priority ?? 'medium'} errors={errors?.priority}>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </SelectField>
        <FormField name="dueDate" label="Due date" type="date" defaultValue={values?.dueDate} errors={errors?.dueDate} />
        <SelectField name="projectId" label="Project" defaultValue={values?.projectId ?? ''} errors={errors?.projectId}>
          <option value="">No project (personal)</option>
          {writableProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </SelectField>
      </div>

      {state?.message && <Alert>{state.message}</Alert>}

      <div className="flex justify-end gap-2 pt-1">
        {inModal ? (
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        ) : (
          <Link href={next} className={buttonClassName('secondary')}>
            Cancel
          </Link>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
