import * as collaboratorService from '../../src/services/collaboratorService';
import * as collaboratorRepositoryModule from '../../src/repositories/collaboratorRepository';
import * as taskRepositoryModule from '../../src/repositories/taskRepository';
import * as userRepositoryModule from '../../src/repositories/userRepository';
import { fakeCollaborator, fakeTask, fakeUser } from '../fakes';

// Hoisted above the imports by ts-jest, so the services get the mocks.
jest.mock('../../src/repositories/collaboratorRepository');
jest.mock('../../src/repositories/taskRepository');
jest.mock('../../src/repositories/userRepository');

// jest.mock() replaced every export with a jest.fn(); jest.mocked() gives them their mock types.
const collaboratorRepository = jest.mocked(collaboratorRepositoryModule);
const taskRepository = jest.mocked(taskRepositoryModule);
const userRepository = jest.mocked(userRepositoryModule);

// Task 1 belongs to user 1.
const ownedTask = fakeTask({ id: 1, userId: 1 });

describe('collaboratorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    taskRepository.findById.mockResolvedValue(ownedTask);
    userRepository.findById.mockResolvedValue(fakeUser({ id: 2 }));
  });

  // ==================== ADD ====================

  describe('addCollaborator', () => {
    it('adds a viewer by default', async () => {
      collaboratorRepository.isCollaborator.mockResolvedValue(false);
      collaboratorRepository.addCollaborator.mockResolvedValue(fakeCollaborator({ taskId: 1, userId: 2, role: 'viewer' }));

      const result = await collaboratorService.addCollaborator(1, 1, 2);

      expect(collaboratorRepository.addCollaborator).toHaveBeenCalledWith(1, 2, 'viewer');
      expect(result.role).toBe('viewer');
    });

    it('adds an editor when role is specified', async () => {
      collaboratorRepository.isCollaborator.mockResolvedValue(false);
      collaboratorRepository.addCollaborator.mockResolvedValue(fakeCollaborator({ taskId: 1, userId: 2, role: 'editor' }));

      await collaboratorService.addCollaborator(1, 1, 2, 'editor');

      expect(collaboratorRepository.addCollaborator).toHaveBeenCalledWith(1, 2, 'editor');
    });

    it('throws 403 if requester is a collaborator but not the owner', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('editor');

      await expect(collaboratorService.addCollaborator(1, 99, 2)).rejects.toMatchObject({ statusCode: 403 });
      expect(collaboratorRepository.addCollaborator).not.toHaveBeenCalled();
    });

    it('throws 404 if requester has no access to the task', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(null);

      await expect(collaboratorService.addCollaborator(1, 99, 2)).rejects.toMatchObject({ statusCode: 404 });
      expect(collaboratorRepository.addCollaborator).not.toHaveBeenCalled();
    });

    it('throws 404 if the task does not exist', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(collaboratorService.addCollaborator(1, 1, 2)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 if owner tries to add themselves', async () => {
      await expect(collaboratorService.addCollaborator(1, 1, 1)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 404 if the user to add does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(collaboratorService.addCollaborator(1, 1, 2)).rejects.toMatchObject({ statusCode: 404 });
      expect(collaboratorRepository.addCollaborator).not.toHaveBeenCalled();
    });

    it('throws 409 if user is already a collaborator', async () => {
      collaboratorRepository.isCollaborator.mockResolvedValue(true);

      await expect(collaboratorService.addCollaborator(1, 1, 2)).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  // ==================== LIST ====================

  describe('getCollaborators', () => {
    it('returns collaborators for the owner', async () => {
      collaboratorRepository.getCollaborators.mockResolvedValue([fakeCollaborator({ userId: 2 })]);

      const result = await collaboratorService.getCollaborators(1, 1);

      expect(collaboratorRepository.getCollaborators).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
    });

    it('returns collaborators for a viewer collaborator', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('viewer');
      collaboratorRepository.getCollaborators.mockResolvedValue([fakeCollaborator({ userId: 2 })]);

      await expect(collaboratorService.getCollaborators(1, 2)).resolves.toHaveLength(1);
    });

    it('throws 404 and never reads collaborators if user has no access', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(null);

      await expect(collaboratorService.getCollaborators(1, 99)).rejects.toMatchObject({ statusCode: 404 });
      expect(collaboratorRepository.getCollaborators).not.toHaveBeenCalled();
    });
  });

  // ==================== REMOVE ====================

  describe('removeCollaborator', () => {
    it('removes collaborator if requester is owner', async () => {
      collaboratorRepository.isCollaborator.mockResolvedValue(true);
      collaboratorRepository.removeCollaborator.mockResolvedValue(fakeCollaborator({ taskId: 1, userId: 2 }));

      await expect(collaboratorService.removeCollaborator(1, 1, 2)).resolves.toBeDefined();
    });

    it('throws 403 if requester is a collaborator but not the owner', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('viewer');

      await expect(collaboratorService.removeCollaborator(1, 99, 2)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 404 if collaborator does not exist', async () => {
      collaboratorRepository.isCollaborator.mockResolvedValue(false);

      await expect(collaboratorService.removeCollaborator(1, 1, 2)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ==================== UPDATE ROLE ====================

  describe('updateCollaboratorRole', () => {
    it('updates role if requester is owner', async () => {
      collaboratorRepository.updateCollaboratorRole.mockResolvedValue(fakeCollaborator({ taskId: 1, userId: 2, role: 'editor' }));

      const result = await collaboratorService.updateCollaboratorRole(1, 1, 2, 'editor');

      expect(result.role).toBe('editor');
    });

    it('throws 403 if requester is a collaborator but not the owner', async () => {
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('editor');

      await expect(collaboratorService.updateCollaboratorRole(1, 99, 2, 'editor')).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 404 if collaborator does not exist', async () => {
      collaboratorRepository.updateCollaboratorRole.mockResolvedValue(null);

      await expect(collaboratorService.updateCollaboratorRole(1, 1, 2, 'editor')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
