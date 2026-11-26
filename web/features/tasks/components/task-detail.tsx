import type { Project } from '@/features/projects/project.types';
import type { Task } from '../task.types';
import { DeleteTaskButton } from './delete-task-button';
import { TaskForm } from './task-form';

interface TaskDetailProps {
  task: Task;
  projects: Project[];
  next: string;
  inModal?: boolean;
}

// A task's detail: the form (edit, or read-only for a viewer) and, for its owner only, Delete.
// The same content in the modal and on the full page.
export function TaskDetail({ task, projects, next, inModal = false }: TaskDetailProps) {
  return (
    <div className="flex flex-col gap-5">
      <TaskForm task={task} projects={projects} next={next} inModal={inModal} />
      {task.role === 'owner' && (
        <div className="border-t border-border pt-4">
          <DeleteTaskButton taskId={task.id} next={next} />
        </div>
      )}
    </div>
  );
}
