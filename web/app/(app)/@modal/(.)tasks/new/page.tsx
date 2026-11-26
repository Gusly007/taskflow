import { Modal } from '@/components/ui/modal';
import { listProjects } from '@/features/projects/project.service';
import { parseNextParam } from '@/features/tasks/search-params';
import { TaskForm } from '@/features/tasks/components/task-form';

// "New task" clicked in the list: Next intercepts /tasks/new ("(.)" = a route at the same level
// as this slot, @modal and (app) don't count) and shows it here, over the list that stays behind.
// A direct link or a refresh on /tasks/new isn't intercepted: it shows app/(app)/tasks/new/page.tsx.
export default async function NewTaskModal(props: PageProps<'/tasks/new'>) {
  const next = parseNextParam(await props.searchParams);
  const projects = await listProjects();

  return (
    <Modal title="New task">
      <TaskForm projects={projects} next={next} inModal />
    </Modal>
  );
}
