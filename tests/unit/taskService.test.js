jest.mock('../../src/repositories/taskRepository');
jest.mock('../../src/repositories/collaboratorRepositorie');

const taskService = require('../../src/services/taskService');
const taskRepository = require('../../src/repositories/taskRepository');
const collaboratorRepository = require('../../src/repositories/collaboratorRepositorie');

describe('taskService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ==================== CREATE ====================

  describe('create', () => {
    it('creates a task and injects userId from token (not body)', async () => {
      const mockTask = { id: 1, title: 'Task', userId: 5 };
      taskRepository.create.mockResolvedValue(mockTask);

      const result = await taskService.create(5, { title: 'Task' });

      expect(taskRepository.create).toHaveBeenCalledWith({ title: 'Task', userId: 5 });
      expect(result).toEqual(mockTask);
    });
  });

  // ==================== GET ALL ====================

  describe('getAllByUser', () => {
    it('returns owned and collaborated tasks', async () => {
      const mockTasks = [{ id: 1 }, { id: 2 }];
      taskRepository.findAllIncludingCollaborated.mockResolvedValue(mockTasks);

      const result = await taskService.getAllByUser(5);

      expect(taskRepository.findAllIncludingCollaborated).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockTasks);
    });
  });

  // ==================== GET MINE ====================

  describe('getMyTasks', () => {
    it('returns only owned tasks', async () => {
      const mockTasks = [{ id: 1, userId: 5 }];
      taskRepository.findAllByUser.mockResolvedValue(mockTasks);

      const result = await taskService.getMyTasks(5);

      expect(taskRepository.findAllByUser).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockTasks);
    });
  });

  // ==================== GET BY ID ====================

  describe('getById', () => {
    it('returns task if user is owner', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 5 });

      const task = await taskService.getById(1, 5);

      expect(task.id).toBe(1);
      expect(collaboratorRepository.isCollaborator).not.toHaveBeenCalled();
    });

    it('returns task if user is collaborator', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.isCollaborator.mockResolvedValue(true);

      const task = await taskService.getById(1, 5);

      expect(task.id).toBe(1);
    });

    it('throws 404 if task does not exist', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(taskService.getById(1, 5)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 403 if user is neither owner nor collaborator', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.isCollaborator.mockResolvedValue(false);

      await expect(taskService.getById(1, 5)).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // ==================== UPDATE ====================

  describe('update', () => {
    it('allows owner to update', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 5 });
      taskRepository.update.mockResolvedValue({ id: 1, title: 'New Title' });

      const result = await taskService.update(1, 5, { title: 'New Title' });

      expect(taskRepository.update).toHaveBeenCalledWith(1, { title: 'New Title' });
      expect(result.title).toBe('New Title');
    });

    it('allows editor collaborator to update', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('editor');
      taskRepository.update.mockResolvedValue({ id: 1, title: 'Updated' });

      await expect(taskService.update(1, 5, { title: 'Updated' })).resolves.toBeDefined();
    });

    it('throws 403 for viewer collaborator', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('viewer');

      await expect(taskService.update(1, 5, {})).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 403 if user has no access', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(null);

      await expect(taskService.update(1, 5, {})).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 404 if task does not exist', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(taskService.update(1, 5, {})).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // ==================== REMOVE ====================

  describe('remove', () => {
    it('allows owner to delete', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 5 });
      taskRepository.remove.mockResolvedValue({ id: 1 });

      await expect(taskService.remove(1, 5)).resolves.toBeDefined();
      expect(taskRepository.remove).toHaveBeenCalledWith(1);
    });

    it('throws 403 for non-owner (collaborator cannot delete)', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });

      await expect(taskService.remove(1, 5)).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 404 if task does not exist', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(taskService.remove(1, 5)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
