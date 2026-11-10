const { body } = require('express-validator');

const STATUSES = ['todo', 'in-progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const statusRule = () =>
  body('status').optional().isIn(STATUSES).withMessage('Status must be todo, in-progress, or done');

const priorityRule = () =>
  body('priority').optional().isIn(PRIORITIES).withMessage('Priority must be low, medium, or high');

// dueDate is a calendar day "YYYY-MM-DD". Sending null removes the due date.
const dueDateRule = () =>
  body('dueDate')
    .optional({ values: 'null' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('dueDate must be a valid date in YYYY-MM-DD format');

exports.validateCreateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  statusRule(),
  priorityRule(),
  dueDateRule(),
];

exports.validateUpdateTask = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  statusRule(),
  priorityRule(),
  dueDateRule(),
];

exports.STATUSES = STATUSES;
exports.PRIORITIES = PRIORITIES;
