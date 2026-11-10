jest.mock('../../src/repositories/taskRepository');
jest.mock('../../src/repositories/collaboratorRepositorie');

const { getTaskRole, assertTaskAccess } = require('../../src/policies/taskPolicy');
const taskRepository = require('../../src/repositories/taskRepository');
const collaboratorRepository = require('../../src/repositories/collaboratorRepositorie');

describe('taskPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    taskRepository.findById.mockResolvedValue({ id: 1, userId: 5 });
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

  describe('assertTaskAccess', () => {
    const cases = [
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
