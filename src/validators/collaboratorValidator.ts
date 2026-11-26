import { body } from 'express-validator';
import { COLLABORATOR_ROLES } from '../models/TaskCollaborator';

export const validateAddCollaborator = [
  body('userId').isInt({ min: 1 }).withMessage('userId must be a valid integer'),
  body('role').optional().isIn(COLLABORATOR_ROLES).withMessage('Role must be viewer or editor'),
];

export const validateUpdateRole = [body('role').isIn(COLLABORATOR_ROLES).withMessage('Role must be viewer or editor')];
