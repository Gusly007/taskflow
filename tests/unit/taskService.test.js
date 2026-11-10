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

    it('keeps only writable fields (drops id, userId, createdAt...)', async () => {
      taskRepository.create.mockResolvedValue({});

      await taskService.create(5, {
        title: 'Task', priority: 'high', dueDate: '2026-11-20', id: 777, userId: 9, createdAt: 'x',
      });

      expect(taskRepository.create).toHaveBeenCalledWith({
        title: 'Task', priority: 'high', dueDate: '2026-11-20', userId: 5,
      });
    });
  });

  // ==================== GET ALL ====================

  describe('getAllByUser', () => {
    it('returns owned and collaborated tasks with pagination meta', async () => {
      const mockTasks = [{ id: 1 }, { id: 2 }];
      taskRepository.findAllIncludingCollaborated.mockResolvedValue({ rows: mockTasks, count: 45 });

      const result = await taskService.getAllByUser(5, { page: 2, limit: 20 });

      expect(taskRepository.findAllIncludingCollaborated).toHaveBeenCalledWith(5, expect.objectContaining({ limit: 20, offset: 20 }));
      expect(result).toEqual({ items: mockTasks, meta: { page: 2, limit: 20, total: 45, totalPages: 3 } });
    });
  });

  // ==================== GET MINE ====================

  describe('getMyTasks', () => {
    it('returns only owned tasks', async () => {
      const mockTasks = [{ id: 1, userId: 5 }];
      taskRepository.findAllByUser.mockResolvedValue({ rows: mockTasks, count: 1 });

      const result = await taskService.getMyTasks(5, {});

      expect(taskRepository.findAllByUser).toHaveBeenCalledWith(5, expect.any(Object));
      expect(result.items).toEqual(mockTasks);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });
  });

  // ==================== LIST OPTIONS ====================

  describe('buildListOptions', () => {
    it('uses defaults: page 1, 20 per page, newest first', () => {
      const options = taskService.buildListOptions({}, '2026-11-10');

      expect(options).toMatchObject({
        page: 1,
        limit: 20,
        offset: 0,
        sort: { field: 'createdAt', direction: 'DESC' },
        filters: { today: '2026-11-10' },
      });
    });

    it('parses sort direction from the - prefix', () => {
      expect(taskService.buildListOptions({ sort: 'dueDate' }).sort).toEqual({ field: 'dueDate', direction: 'ASC' });
      expect(taskService.buildListOptions({ sort: '-priority' }).sort).toEqual({ field: 'priority', direction: 'DESC' });
    });

    it('computes the offset from page and limit', () => {
      expect(taskService.buildListOptions({ page: 3, limit: 10 }).offset).toBe(20);
    });

    it('passes filters through', () => {
      const { filters } = taskService.buildListOptions({ status: ['todo'], priority: ['high'], overdue: true });

      expect(filters).toMatchObject({ status: ['todo'], priority: ['high'], overdue: true });
    });
  });

  // ==================== GET BY ID ====================

  describe('getById', () => {
    it('returns task if user is owner', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 5 });

      const task = await taskService.getById(1, 5);

      expect(task.id).toBe(1);
      expect(collaboratorRepository.getCollaboratorRole).not.toHaveBeenCalled();
    });

    it('returns task if user is collaborator', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('viewer');

      const task = await taskService.getById(1, 5);

      expect(task.id).toBe(1);
    });

    it('throws 404 if task does not exist', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(taskService.getById(1, 5)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 404 if user is neither owner nor collaborator', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(null);

      await expect(taskService.getById(1, 5)).rejects.toMatchObject({ statusCode: 404 });
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

    it('never passes userId or id to the repository', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('editor');
      taskRepository.update.mockResolvedValue({});

      await taskService.update(1, 5, { title: 'T', userId: 5, id: 42 });

      expect(taskRepository.update).toHaveBeenCalledWith(1, { title: 'T' });
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

    it('throws 404 if user has no access', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(null);

      await expect(taskService.update(1, 5, {})).rejects.toMatchObject({ statusCode: 404 });
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

    it('throws 403 for an editor collaborator (only owner can delete)', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue('editor');

      await expect(taskService.remove(1, 5)).rejects.toMatchObject({ statusCode: 403 });
      expect(taskRepository.remove).not.toHaveBeenCalled();
    });

    it('throws 404 if user has no access', async () => {
      taskRepository.findById.mockResolvedValue({ id: 1, userId: 999 });
      collaboratorRepository.getCollaboratorRole.mockResolvedValue(null);

      await expect(taskService.remove(1, 5)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 404 if task does not exist', async () => {
      taskRepository.findById.mockResolvedValue(null);

      await expect(taskService.remove(1, 5)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
