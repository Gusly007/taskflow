const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const collaboratorController = require('../controllers/collaboratorController');
const auth = require('../middlewares/authMiddleware');
const { validateCreateTask, validateUpdateTask, validateListTasks } = require('../validators/taskValidator');
const { validateAddCollaborator, validateUpdateRole } = require('../validators/collaboratorValidator');
const validate = require('../middlewares/validateMiddleware');
const { validateTaskId, validateCollaboratorParams } = require('../validators/paramValidator');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints (requires authentication)
 */

router.use(auth);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Buy groceries
 *               description:
 *                 type: string
 *                 example: Milk, eggs, bread
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, done]
 *                 default: todo
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: '2026-11-20'
 *                 description: Calendar day (YYYY-MM-DD)
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateCreateTask, validate, taskController.create);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks (owned + collaborated), filtered, sorted and paginated
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, example: 'todo,in-progress' }
 *         description: One or more statuses, comma-separated
 *       - in: query
 *         name: priority
 *         schema: { type: string, example: 'high' }
 *         description: One or more priorities (low, medium, high), comma-separated
 *       - in: query
 *         name: overdue
 *         schema: { type: boolean }
 *         description: true = due date in the past and not done; false = everything else
 *       - in: query
 *         name: dueAfter
 *         schema: { type: string, format: date }
 *         description: Due on or after this day (YYYY-MM-DD)
 *       - in: query
 *         name: dueBefore
 *         schema: { type: string, format: date }
 *         description: Due on or before this day (YYYY-MM-DD)
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-createdAt', example: 'dueDate' }
 *         description: createdAt, updatedAt, dueDate, priority, title or status. Prefix with - for descending. Tasks without due date always come last.
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Page of tasks in data, pagination in meta { page, limit, total, totalPages }
 *       400:
 *         description: Invalid query parameter
 *       401:
 *         description: Unauthorized
 */
router.get('/', validateListTasks, validate, taskController.getAll);

/**
 * @swagger
 * /tasks/mine:
 *   get:
 *     summary: Get only tasks owned by the authenticated user (same filters as GET /tasks)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, example: 'todo,in-progress' }
 *         description: One or more statuses, comma-separated
 *       - in: query
 *         name: priority
 *         schema: { type: string, example: 'high' }
 *         description: One or more priorities (low, medium, high), comma-separated
 *       - in: query
 *         name: overdue
 *         schema: { type: boolean }
 *         description: true = due date in the past and not done; false = everything else
 *       - in: query
 *         name: dueAfter
 *         schema: { type: string, format: date }
 *         description: Due on or after this day (YYYY-MM-DD)
 *       - in: query
 *         name: dueBefore
 *         schema: { type: string, format: date }
 *         description: Due on or before this day (YYYY-MM-DD)
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: '-createdAt', example: 'dueDate' }
 *         description: createdAt, updatedAt, dueDate, priority, title or status. Prefix with - for descending. Tasks without due date always come last.
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Page of owned tasks in data, pagination in meta
 *       400:
 *         description: Invalid query parameter
 *       401:
 *         description: Unauthorized
 */
router.get('/mine', validateListTasks, validate, taskController.getMine);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (user can see the task but lacks the required role)
 *       404:
 *         description: Task not found, or the user has no access to it
 */
router.get('/:id', validateTaskId, validate, taskController.getById);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task (owner or editor)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Buy groceries updated
 *               description:
 *                 type: string
 *                 example: Milk, eggs, bread, butter
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, done]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: '2026-11-20'
 *                 description: Calendar day (YYYY-MM-DD). Send null to remove the due date.
 *             description: Any other field (userId, id...) is ignored.
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (user can see the task but lacks the required role)
 *       404:
 *         description: Task not found, or the user has no access to it
 */
router.put('/:id', validateTaskId, validateUpdateTask, validate, taskController.update);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task (owner only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (user can see the task but lacks the required role)
 *       404:
 *         description: Task not found, or the user has no access to it
 */
router.delete('/:id', validateTaskId, validate, taskController.remove);

/**
 * @swagger
 * /tasks/{id}/collaborators:
 *   get:
 *     summary: List collaborators of a task (owner or collaborator only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of collaborators
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found, or the user has no access to it
 */
router.get('/:id/collaborators', validateTaskId, validate, collaboratorController.list);

/**
 * @swagger
 * /tasks/{id}/collaborators:
 *   post:
 *     summary: Add a collaborator to a task (owner only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 2
 *               role:
 *                 type: string
 *                 enum: [viewer, editor]
 *                 default: viewer
 *     responses:
 *       201:
 *         description: Collaborator added successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied (collaborators cannot add collaborators)
 *       404:
 *         description: Task or user not found, or the requester has no access to the task
 *       409:
 *         description: User is already a collaborator
 */
router.post('/:id/collaborators', validateTaskId, validateAddCollaborator, validate, collaboratorController.add);

/**
 * @swagger
 * /tasks/{id}/collaborators/{userId}:
 *   patch:
 *     summary: Update a collaborator's role (owner only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [viewer, editor]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Collaborator not found
 */
router.patch('/:id/collaborators/:userId', validateCollaboratorParams, validateUpdateRole, validate, collaboratorController.updateRole);

/**
 * @swagger
 * /tasks/{id}/collaborators/{userId}:
 *   delete:
 *     summary: Remove a collaborator from a task (owner only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Collaborator removed successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Collaborator not found
 */
router.delete('/:id/collaborators/:userId', validateCollaboratorParams, validate, collaboratorController.remove);

module.exports = router;
