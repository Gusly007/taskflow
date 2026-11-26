import type { Task } from '../task.types';
import { TaskStatusMenu } from './task-status-menu';

interface TaskListProps {
  tasks: Task[];
  // Project id -> name, to label the tasks that belong to a project.
  projectNames: Map<number, string>;
}

export function TaskList({ tasks, projectNames }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No tasks yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {tasks.map((task) => {
        const projectName = task.projectId === null ? undefined : projectNames.get(task.projectId);
        return (
          <li key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate">{task.title}</span>
              {projectName && (
                <span className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                  {projectName}
                </span>
              )}
            </span>
            <TaskStatusMenu taskId={task.id} status={task.status} />
          </li>
        );
      })}
    </ul>
  );
}
