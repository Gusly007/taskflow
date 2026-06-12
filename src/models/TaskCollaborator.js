const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TaskCollaborator = sequelize.define('TaskCollaborator', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },    
    taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },    
    userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    },
  role: {
    type: DataTypes.ENUM('viewer', 'editor'),
    defaultValue: 'viewer',
    allowNull: false,
  },
 }, {
        tableName: 'task_collaborators',
        timestamps: true,
});
module.exports = TaskCollaborator;