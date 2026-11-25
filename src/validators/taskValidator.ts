import { body, query } from 'express-validator';
import { TASK_PRIORITIES, TASK_SORT_FIELDS, TASK_STATUSES } from '../models/Task';

const statusRule = () =>
  body('status').optional().isIn(TASK_STATUSES).withMessage('Status must be todo, in-progress, or done');

const priorityRule = () =>
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage('Priority must be low, medium, or high');

// dueDate is a calendar day "YYYY-MM-DD". Sending null removes the due date.
const dueDateRule = () =>
  body('dueDate')
    .optional({ values: 'null' })
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('dueDate must be a valid date in YYYY-MM-DD format');

export const validateCreateTask = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  statusRule(),
  priorityRule(),
  dueDateRule(),
];

export const validateUpdateTask = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  statusRule(),
  priorityRule(),
  dueDateRule(),
];

// ---------- GET /api/tasks and /api/tasks/mine (query string) ----------

const SORT_VALUES = [...TASK_SORT_FIELDS, ...TASK_SORT_FIELDS.map((field) => `-${field}`)];

// ?status=todo,in-progress -> ['todo', 'in-progress']
const csvQuery = (field: string, allowed: readonly string[]) =>
  query(field)
    .optional()
    .isString()
    .withMessage(`${field} must be a comma-separated list`)
    .bail()
    .customSanitizer((value: string) =>
      value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    )
    .custom((values: string[]) => values.length > 0 && values.every((v) => allowed.includes(v)))
    .withMessage(`${field} must be one or more of: ${allowed.join(', ')}`);

const dateQuery = (field: string) =>
  query(field)
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage(`${field} must be a valid date in YYYY-MM-DD format`);

export const validateListTasks = [
  csvQuery('status', TASK_STATUSES),
  csvQuery('priority', TASK_PRIORITIES),
  query('overdue').optional().isBoolean().withMessage('overdue must be true or false').toBoolean(),
  dateQuery('dueAfter'),
  dateQuery('dueBefore'),
  query('sort')
    .optional()
    .isIn(SORT_VALUES)
    .withMessage(`sort must be one of: ${TASK_SORT_FIELDS.join(', ')} (prefix with - for descending)`),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer >= 1').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100')
    .toInt(),
];
