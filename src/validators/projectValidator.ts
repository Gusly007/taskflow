import { body, param } from 'express-validator';
import { PROJECT_MEMBER_ROLES } from '../models/ProjectMember';

export const validateProjectId = [param('id').isInt({ min: 1 }).withMessage('Project id must be a positive integer')];

export const validateMemberParams = [
  ...validateProjectId,
  param('userId').isInt({ min: 1 }).withMessage('userId must be a positive integer'),
];

export const validateCreateProject = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').optional({ values: 'null' }).trim(),
];

export const validateUpdateProject = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional({ values: 'null' }).trim(),
];

export const validateAddMember = [
  body('userId').isInt({ min: 1 }).withMessage('userId must be a valid integer').toInt(),
  body('role').optional().isIn(PROJECT_MEMBER_ROLES).withMessage('Role must be viewer or editor'),
];

export const validateUpdateMemberRole = [
  body('role').isIn(PROJECT_MEMBER_ROLES).withMessage('Role must be viewer or editor'),
];
