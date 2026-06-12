const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const collaboratorController = require('../controllers/collaboratorController');
const auth = require('../middlewares/authMiddleware');
const { validateCreateTask, validateUpdateTask } = require('../validators/taskValidator');
const { validateAddCollaborator, validateUpdateRole } = require('../validators/collaboratorValidator');
const validate = require('../middlewares/validateMiddleware');

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
 *     summary: Get all tasks (owned + collaborated)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *       401:
 *         description: Unauthorized
 */
router.get('/', taskController.getAll);

/**
 * @swagger
 * /tasks/mine:
 *   get:
 *     summary: Get only tasks owned by the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of owned tasks
 *       401:
 *         description: Unauthorized
 */
router.get('/mine', taskController.getMine);

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
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.get('/:id', taskController.getById);

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
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.put('/:id', validateUpdateTask, validate, taskController.update);

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
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.delete('/:id', taskController.remove);

/**
 * @swagger
 * /tasks/{id}/collaborators:
 *   get:
 *     summary: List collaborators of a task
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
 */
router.get('/:id/collaborators', collaboratorController.list);

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
 *         description: Access denied
 *       409:
 *         description: User is already a collaborator
 */
router.post('/:id/collaborators', validateAddCollaborator, validate, collaboratorController.add);

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
router.patch('/:id/collaborators/:userId', validateUpdateRole, validate, collaboratorController.updateRole);

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
router.delete('/:id/collaborators/:userId', collaboratorController.remove);

module.exports = router;
