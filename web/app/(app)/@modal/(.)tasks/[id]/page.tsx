import { Modal } from '@/components/ui/modal';
import { loadTaskDetail, taskDetailTitle } from '@/features/tasks/task-detail';
import { TaskDetail } from '@/features/tasks/components/task-detail';

// A task clicked in the list: Next intercepts /tasks/12 and shows its detail here, over the list.
// A direct link or a refresh isn't intercepted: it shows app/(app)/tasks/[id]/page.tsx.
export default async function TaskModal(props: PageProps<'/tasks/[id]'>) {
  const { task, projects, next } = await loadTaskDetail(props);

  return (
    <Modal title={taskDetailTitle(task)}>
      <TaskDetail task={task} projects={projects} next={next} inModal />
    </Modal>
  );
}
