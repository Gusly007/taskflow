'use client';

// "Delete task" in the task detail, shown only to the task owner (role from the API, which checks it
// again). The API deletes for good, so a first click only asks for confirmation; Cancel is focused
// so a second Enter doesn't delete by accident.
// Its own <form>, outside the task form: forms can't be nested.
import { useActionState, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { deleteTask } from '../task.actions';

export function DeleteTaskButton({ taskId, next }: { taskId: number; next: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteTask, undefined);

  if (!confirming) {
    return (
      <div className="flex justify-start">
        <Button type="button" variant="ghost" className="text-danger" onClick={() => setConfirming(true)}>
          Delete task
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-md border border-danger/40 bg-danger/10 p-3">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="next" value={next} />
      <p className="text-sm">Delete this task? This can&apos;t be undone.</p>
      {state?.message && <Alert>{state.message}</Alert>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" autoFocus onClick={() => setConfirming(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" disabled={pending}>
          {pending ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </form>
  );
}
