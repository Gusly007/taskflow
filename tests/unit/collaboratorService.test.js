jest.mock('../../src/repositories/collaboratorRepositorie');
jest.mock('../../src/repositories/taskRepository');

const collaboratorService = require('../../src/services/collaboratorService');
const collaboratorRepository = require('../../src/repositories/collaboratorRepositorie');
const taskRepository = require('../../src/repositories/taskRepository');

describe('collaboratorService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ==================== ADD ====================

  describe('addCollaborator', () => {
    it('adds a viewer by default', async () => {
      taskRepository.ownerTask.mockResolvedValue(true);
      collaboratorRepository.isCollaborator.mockResolvedValue(false);
      collaboratorRepository.addCollaborator.mockResolvedValue({ taskId: 1, userId: 2, role: 'viewer' });

      const result = await collaboratorService.addCollaborator(1, 1, 2);

      expect(collaboratorRepository.addCollaborator).toHaveBeenCalledWith(1, 2, 'viewer');
      expect(result.role).toBe('viewer');
    });

    it('adds an editor when role is specified', async () => {
      taskRepository.ownerTask.mockResolvedValue(true);
      collaboratorRepository.isCollaborator.mockResolvedValue(false);
      collaboratorRepository.addCollaborator.mockResolvedValue({ taskId: 1, userId: 2, role: 'editor' });

      await collaboratorService.addCollaborator(1, 1, 2, 'editor');

      expect(collaboratorRepository.addCollaborator).toHaveBeenCalledWith(1, 2, 'editor');
    });

    it('throws 403 if requester is not owner', async () => {
      taskRepository.ownerTask.mockResolvedValue(false);

      await expect(collaboratorService.addCollaborator(1, 99, 2)).rejects.toMatchObject({ statusCode: 403 });
      expect(collaboratorRepository.addCollaborator).not.toHaveBeenCalled();
    });

    it('throws 400 if owner tries to add themselves', async () => {
      taskRepository.ownerTask.mockResolvedValue(true);

      await expect(collaboratorService.addCollaborator(1, 5, 5)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 409 if user is already a collaborator', async () => {
      taskRepository.ownerTask.mockResolvedValue(true);
      collaboratorRepository.isCollaborator.mockResolvedValue(true);

      await expect(collaboratorService.addCollaborator(1, 1, 2)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ==================== REMOVE ====================

  describe('removeCollaborator', () => {
    it('removes collaborator if requester is owner', async () => {
      taskRepository.ownerTask.mockResolvedValue(true);
      collaboratorRepository.isCollaborator.mockResolvedValue(true);
      collaboratorRepository.removeCollaborator.mockResolvedValue({ taskId: 1, userId: 2 });

      await expect(collaboratorService.removeCollaborator(1, 1, 2)).resolves.toBeDefined();
    });

    it('throws 403 if requester is not owner', async () => {
      taskRepository.ownerTask.mockResolvedValue(false);

      await expect(collaboratorService.removeCollaborator(1, 99, 2)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 404 if collaborator does not exist', async () => {
      taskRepository.ownerTask.mockResolvedValue(true);
      collaboratorRepository.isCollaborator.mockResolvedValue(false);

      await expect(collaboratorService.removeCollaborator(1, 1, 2)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ==================== UPDATE ROLE ====================

  describe('updateCollaboratorRole', () => {
    it('updates role if requester is owner', async () => {
      taskRepository.ownerTask.mockResolvedValue(true);
      collaboratorRepository.updateCollaboratorRole.mockResolvedValue({ taskId: 1, userId: 2, role: 'editor' });

      const result = await collaboratorService.updateCollaboratorRole(1, 1, 2, 'editor');

      expect(result.role).toBe('editor');
    });

    it('throws 403 if requester is not owner', async () => {
      taskRepository.ownerTask.mockResolvedValue(false);

      await expect(collaboratorService.updateCollaboratorRole(1, 99, 2, 'editor')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 404 if collaborator does not exist', async () => {
      taskRepository.ownerTask.mockResolvedValue(true);
      collaboratorRepository.updateCollaboratorRole.mockResolvedValue(null);

      await expect(collaboratorService.updateCollaboratorRole(1, 1, 2, 'editor')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
