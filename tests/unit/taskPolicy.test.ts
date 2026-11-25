import {
  getTaskRole,
  assertTaskAccess,
  taskRoleFromProjectRole,
  type TaskRole,
} from '../../src/policies/taskPolicy';
import * as taskRepositoryModule from '../../src/repositories/taskRepository';
import * as collaboratorRepositoryModule from '../../src/repositories/collaboratorRepository';
import * as projectRepositoryModule from '../../src/repositories/projectRepository';
import { fakeProject, fakeTask } from '../fakes';

// Hoisted above the imports by ts-jest, so the services get the mocks.
jest.mock('../../src/repositories/taskRepository');
jest.mock('../../src/repositories/collaboratorRepository');
jest.mock('../../src/repositories/projectRepository');

// jest.mock() replaced every export with a jest.fn(); jest.mocked() gives them their mock types.
const taskRepository = jest.mocked(taskRepositoryModule);
const collaboratorRepository = jest.mocked(collaboratorRepositoryModule);
const projectRepository = jest.mocked(projectRepositoryModule);

describe('taskPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    taskRepository.findById.mockResolvedValue(fakeTask({ id: 1, userId: 5 }));
  });

  describe('getTaskRole', () => {
    it("returns 'owner' for the task owner without querying collaborators", async () => {
      const { role } = await getTaskRole(1, 5);

      expect(role).toBe('owner');
      expect(collaboratorRepository.getCollaboratorRole).not.toHaveBeenCalled();
    });

    it('accepts string ids coming from the URL', async () => {
      const { role } = await getTaskRole('1', '5');

      expect(role).toBe('owner');
      expect(taskRepository.findById).toHaveBeenCalledWith(1);
    });

    it('returns the collaborator role', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('editor');

      const { role } = await getTaskRole(1, 7);

      expect(role).toBe('editor');
    });

    it('returns a null role when the user has no access', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(null);

      const { task, role } = await getTaskRole(1, 7);

      expect(task).not.toBeNull();
      expect(role).toBeNull();
    });
  });

  describe('role through the task project', () => {
    beforeEach(() => {
      taskRepository.findById.mockResolvedValue(fakeTask({ id: 1, userId: 5, projectId: 3 }));
      projectRepository.findById.mockResolvedValue(fakeProject({ id: 3, ownerId: 8 }));
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(null);
    });

    it.each([
      ['owner', 'editor'],
      ['editor', 'editor'],
      ['viewer', 'viewer'],
      [null, null],
    ] as const)('project role %s -> task role %s', (projectRole, taskRole) => {
      expect(taskRoleFromProjectRole(projectRole)).toBe(taskRole);
    });

    it('a project viewer can see the task', async () => {
      projectRepository.getMemberRole.mockResolvedValue('viewer');

      const { role } = await getTaskRole(1, 7);

      expect(role).toBe('viewer');
    });

    it('the project owner edits the task but is not its owner', async () => {
      const { role } = await getTaskRole(1, 8);

      expect(role).toBe('editor');
      await expect(assertTaskAccess(1, 8, 'owner')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('keeps the highest role when the user is both collaborator and project member', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('viewer');
      projectRepository.getMemberRole.mockResolvedValue('editor');

      expect((await getTaskRole(1, 7)).role).toBe('editor');

      collaboratorRepository.getCollaboratorRole.mockResolvedValue('editor');
      projectRepository.getMemberRole.mockResolvedValue('viewer');

      expect((await getTaskRole(1, 7)).role).toBe('editor');
    });

    it('does not look at projects for a task without project', async () => {
      taskRepository.findById.mockResolvedValue(fakeTask({ id: 1, userId: 5, projectId: null }));

      expect((await getTaskRole(1, 7)).role).toBeNull();
      expect(projectRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('assertTaskAccess', () => {
    const cases: Array<[TaskRole | null, TaskRole, number | 'ok']> = [
      // [role of the user, required role, expected status or 'ok']
      ['owner', 'owner', 'ok'],
      ['owner', 'editor', 'ok'],
      ['owner', 'viewer', 'ok'],
      ['editor', 'owner', 403],
      ['editor', 'editor', 'ok'],
      ['editor', 'viewer', 'ok'],
      ['viewer', 'owner', 403],
      ['viewer', 'editor', 403],
      ['viewer', 'viewer', 'ok'],
      [null, 'viewer', 404],
      [null, 'editor', 404],
      [null, 'owner', 404],
    ];

    it.each(cases)('user=%s, required=%s -> %s', async (userRole, required, expected) => {
      const userId = userRole === 'owner' ? 5 : 7;
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(userRole === 'owner' ? null : userRole);

      const call = assertTaskAccess(1, userId, required);

      if (expected === 'ok') {
        await expect(call).resolves.toMatchObject({ role: userRole });
      } else {
        await expect(call).rejects.toMatchObject({ statusCode: expected });
      }
    });

    it('throws 404 when the task does not exist', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(assertTaskAccess(1, 5)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('uses the custom message on 403', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('viewer');

      await expect(assertTaskAccess(1, 7, 'editor', 'Viewers cannot edit tasks')).rejects.toMatchObject({
        statusCode: 403,
        message: 'Viewers cannot edit tasks',
      });
    });
  });
});
