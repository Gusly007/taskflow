import { cn } from '@/lib/cn';
import { PRIORITY_LABELS } from '../task-labels';
import { TASK_PRIORITIES, type TaskPriority } from '../task.types';

// Signal bars: 1 bar = low, 2 = medium, 3 = high (high also in the danger color).
// The bar count carries the meaning, not only the color; the label is read by screen readers
// and shown as a tooltip.
export function TaskPriorityIcon({ priority, className }: { priority: TaskPriority; className?: string }) {
  const level = TASK_PRIORITIES.indexOf(priority) + 1;
  const label = `Priority: ${PRIORITY_LABELS[priority]}`;
  return (
    <span title={label} className={cn('flex shrink-0', priority === 'high' ? 'text-danger' : 'text-muted-foreground', className)}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        {[0, 1, 2].map((bar) => (
          <rect
            key={bar}
            x={2 + bar * 5}
            y={10 - bar * 4}
            width="3"
            height={4 + bar * 4}
            rx="1"
            fill="currentColor"
            opacity={bar < level ? 1 : 0.25}
          />
        ))}
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
