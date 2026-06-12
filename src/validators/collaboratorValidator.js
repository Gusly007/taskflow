const { body } = require('express-validator');

exports.validateAddCollaborator = [
  body('userId').isInt({ min: 1 }).withMessage('userId must be a valid integer'),
  body('role').optional().isIn(['viewer', 'editor']).withMessage('Role must be viewer or editor'),
];

exports.validateUpdateRole = [
  body('role').isIn(['viewer', 'editor']).withMessage('Role must be viewer or editor'),
];
