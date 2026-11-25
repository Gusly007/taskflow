import { param } from 'express-validator';

// Rejects /api/tasks/abc (400) instead of letting a non-numeric id reach the database.
export const validateTaskId = [param('id').isInt({ min: 1 }).withMessage('Task id must be a positive integer')];

export const validateCollaboratorParams = [
  ...validateTaskId,
  param('userId').isInt({ min: 1 }).withMessage('userId must be a positive integer'),
];
