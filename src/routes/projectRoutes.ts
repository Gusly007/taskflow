import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import auth from '../middlewares/authMiddleware';
import validate from '../middlewares/validateMiddleware';
import {
  validateProjectId,
  validateMemberParams,
  validateCreateProject,
  validateUpdateProject,
  validateAddMember,
  validateUpdateMemberRole,
} from '../validators/projectValidator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: |
 *     Projects group tasks and people (requires authentication).
 *     The creator is the project owner; members are viewers (see every task of the project)
 *     or editors (also create and edit tasks in it). Tasks of your projects are returned by
 *     GET /tasks; filter them with GET /tasks?projectId=ID.
 */

router.use(auth);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a project (you become its owner)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Website redesign }
 *               description: { type: string, nullable: true, example: New landing page and blog }
 *     responses:
 *       201:
 *         description: Project created, with role "owner"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateCreateProject, validate, projectController.create);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List the projects you own or are a member of, each with your role
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects, newest first. Each has a role field (owner, editor or viewer).
 *       401:
 *         description: Unauthorized
 */
router.get('/', projectController.list);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a project (any member)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: The project, with your role
 *       404:
 *         description: Project not found, or you are not in it
 */
router.get('/:id', validateProjectId, validate, projectController.getById);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Rename or describe a project (owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Project updated
 *       403:
 *         description: You are a member but not the owner
 *       404:
 *         description: Project not found, or you are not in it
 */
router.put('/:id', validateProjectId, validateUpdateProject, validate, projectController.update);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project (owner only). Its tasks are kept and become personal tasks.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       204:
 *         description: Project deleted
 *       403:
 *         description: You are a member but not the owner
 *       404:
 *         description: Project not found, or you are not in it
 */
router.delete('/:id', validateProjectId, validate, projectController.remove);

/**
 * @swagger
 * /projects/{id}/members:
 *   get:
 *     summary: List the members of a project (any member). The owner is the project's ownerId.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Members (userId, role)
 *       404:
 *         description: Project not found, or you are not in it
 */
router.get('/:id/members', validateProjectId, validate, projectController.listMembers);

/**
 * @swagger
 * /projects/{id}/members:
 *   post:
 *     summary: Add a member (owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: integer, example: 2 }
 *               role: { type: string, enum: [viewer, editor], default: viewer }
 *     responses:
 *       201:
 *         description: Member added
 *       400:
 *         description: Validation error, or the user is the owner
 *       403:
 *         description: You are a member but not the owner
 *       404:
 *         description: Project or user not found
 *       409:
 *         description: Already a member
 */
router.post('/:id/members', validateProjectId, validateAddMember, validate, projectController.addMember);

/**
 * @swagger
 * /projects/{id}/members/{userId}:
 *   patch:
 *     summary: Change a member's role (owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [viewer, editor] }
 *     responses:
 *       200:
 *         description: Role updated
 *       403:
 *         description: You are a member but not the owner
 *       404:
 *         description: Member not found
 */
router.patch(
  '/:id/members/:userId',
  validateMemberParams,
  validateUpdateMemberRole,
  validate,
  projectController.updateMemberRole,
);

/**
 * @swagger
 * /projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member (owner), or leave the project (your own userId)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *       - { in: path, name: userId, required: true, schema: { type: integer } }
 *     responses:
 *       200:
 *         description: Member removed
 *       400:
 *         description: The owner cannot leave their own project
 *       403:
 *         description: Only the owner can remove other members
 *       404:
 *         description: Member not found
 */
router.delete('/:id/members/:userId', validateMemberParams, validate, projectController.removeMember);

export default router;
