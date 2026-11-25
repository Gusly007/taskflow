import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/db';

export const COLLABORATOR_ROLES = ['viewer', 'editor'] as const;
export type CollaboratorRole = (typeof COLLABORATOR_ROLES)[number];

class TaskCollaborator extends Model<InferAttributes<TaskCollaborator>, InferCreationAttributes<TaskCollaborator>> {
  declare id: CreationOptional<number>;
  declare taskId: number;
  declare userId: number;
  declare role: CreationOptional<CollaboratorRole>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TaskCollaborator.init(
  {
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
      type: DataTypes.ENUM(...COLLABORATOR_ROLES),
      defaultValue: 'viewer',
      allowNull: false,
    },
    // Filled in by Sequelize (timestamps: true). Listed only because the init() types require
    // every declared attribute; this is what the Sequelize docs recommend.
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: 'TaskCollaborator',
    tableName: 'task_collaborators',
    timestamps: true,
  },
);

export default TaskCollaborator;
